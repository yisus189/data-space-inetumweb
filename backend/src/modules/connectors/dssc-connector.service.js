const fetchLib = require('node-fetch');
const fs = require('fs');
const https = require('https');

const CONNECTOR_MODE = (process.env.DATASPACE_CONNECTOR_MODE || 'LOCAL_ENFORCEMENT').toUpperCase();
const CONNECTOR_BASE_URL = process.env.DSSC_CONNECTOR_BASE_URL || null;
const CONNECTOR_API_KEY = process.env.DSSC_CONNECTOR_API_KEY || null;
const CONNECTOR_TIMEOUT_MS = Number(process.env.DSSC_CONNECTOR_TIMEOUT_MS || 5000);
const CONNECTOR_RETRY_MAX = Number(process.env.DSSC_CONNECTOR_RETRY_MAX || 2);
const CONNECTOR_RETRY_BASE_MS = Number(process.env.DSSC_CONNECTOR_RETRY_BASE_MS || 150);
const CIRCUIT_BREAKER_THRESHOLD = Number(process.env.DSSC_CONNECTOR_CIRCUIT_BREAKER_THRESHOLD || 5);
const CIRCUIT_BREAKER_COOLDOWN_MS = Number(process.env.DSSC_CONNECTOR_CIRCUIT_BREAKER_COOLDOWN_MS || 30000);
const ADAPTER_CONTRACT_VERSION = '1.0';
const SUPPORTED_DATA_ACTIONS = new Set(['use', 'download', 'read']);
const MAX_PENDING_OPERATIONS = Number(process.env.DSSC_CONNECTOR_PENDING_MAX || 500);
const DSSC_CONNECTOR_PROFILE = (process.env.DSSC_CONNECTOR_PROFILE || 'GENERIC').toUpperCase();
const DSSC_CONNECTOR_SYNC_PATH = process.env.DSSC_CONNECTOR_SYNC_PATH || '/control-plane/contracts/sync';
const DSSC_CONNECTOR_REVOKE_PATH = process.env.DSSC_CONNECTOR_REVOKE_PATH || '/control-plane/contracts/revoke';
const DSSC_CONNECTOR_ACCESS_PATH = process.env.DSSC_CONNECTOR_ACCESS_PATH || '/data-plane/access/request';
const DSSC_CONNECTOR_HEALTH_PATH = process.env.DSSC_CONNECTOR_HEALTH_PATH || '/health';
const DSSC_CONNECTOR_AUTH_MODE = (process.env.DSSC_CONNECTOR_AUTH_MODE || 'BEARER').toUpperCase();
const DSSC_CONNECTOR_AUTH_HEADER = process.env.DSSC_CONNECTOR_AUTH_HEADER || null;
const DSSC_CONNECTOR_AUTH_PREFIX = process.env.DSSC_CONNECTOR_AUTH_PREFIX || 'Bearer';
const DSSC_CONNECTOR_MTLS_ENABLED = process.env.DSSC_CONNECTOR_MTLS_ENABLED === 'true';
const DSSC_CONNECTOR_MTLS_CERT_PATH = process.env.DSSC_CONNECTOR_MTLS_CERT_PATH || null;
const DSSC_CONNECTOR_MTLS_KEY_PATH = process.env.DSSC_CONNECTOR_MTLS_KEY_PATH || null;
const DSSC_CONNECTOR_MTLS_CA_PATH = process.env.DSSC_CONNECTOR_MTLS_CA_PATH || null;

const connectorCircuitState = {
  failures: 0,
  openUntil: 0
};

const adapterMetrics = {
  calls: 0,
  successes: 0,
  failures: 0,
  retries: 0,
  queuedForReconcile: 0
};

const pendingOperations = [];

const fetchFn = typeof fetchLib === 'function' ? fetchLib : fetchLib.default;

if (typeof fetchFn !== 'function') {
  throw new Error('No se pudo inicializar cliente HTTP para conector DSSC');
}

function nowMs() {
  return Date.now();
}

function ensureCircuitClosed() {
  if (connectorCircuitState.openUntil > nowMs()) {
    const err = new Error('Conector DSSC temporalmente no disponible (circuit breaker abierto)');
    err.status = 503;
    err.code = 'CONNECTOR_CIRCUIT_OPEN';
    throw err;
  }

  if (connectorCircuitState.openUntil > 0 && connectorCircuitState.openUntil <= nowMs()) {
    connectorCircuitState.failures = 0;
    connectorCircuitState.openUntil = 0;
  }
}

function trackConnectorSuccess() {
  connectorCircuitState.failures = 0;
  connectorCircuitState.openUntil = 0;
  adapterMetrics.successes += 1;
}

function trackConnectorFailure() {
  connectorCircuitState.failures += 1;
  adapterMetrics.failures += 1;
  if (connectorCircuitState.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    connectorCircuitState.openUntil = nowMs() + CIRCUIT_BREAKER_COOLDOWN_MS;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeConnectorContext(context = {}, operation) {
  return {
    ...context,
    operation,
    contractVersion: ADAPTER_CONTRACT_VERSION
  };
}

function buildAdapterMeta(operation, attempts = 0) {
  return {
    contractVersion: ADAPTER_CONTRACT_VERSION,
    operation,
    attempts
  };
}

function getConnectorHeaders(context = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (CONNECTOR_API_KEY) {
    if (DSSC_CONNECTOR_AUTH_MODE === 'CUSTOM_HEADER') {
      headers[DSSC_CONNECTOR_AUTH_HEADER || 'X-API-Key'] = CONNECTOR_API_KEY;
    } else if (DSSC_CONNECTOR_AUTH_MODE === 'NONE') {
      // no-op
    } else {
      headers.Authorization = `${DSSC_CONNECTOR_AUTH_PREFIX} ${CONNECTOR_API_KEY}`;
    }
  }

  if (context.requestId) {
    headers['X-Request-Id'] = context.requestId;
  }

  if (context.idempotencyKey) {
    headers['Idempotency-Key'] = context.idempotencyKey;
  }

  headers['X-Adapter-Contract-Version'] = context.contractVersion || ADAPTER_CONTRACT_VERSION;

  if (context.operation) {
    headers['X-Connector-Operation'] = context.operation;
  }

  return headers;
}

function validateContractPayload(contract) {
  if (!contract || !contract.id || !contract.providerId || !contract.consumerId || !contract.datasetId) {
    const err = new Error('Contrato inválido para sincronización con conector');
    err.status = 400;
    err.code = 'INVALID_CONNECTOR_CONTRACT_PAYLOAD';
    throw err;
  }
}

function validateDataPlanePayload({ dataset, contract, consumerId, action }) {
  if (!dataset?.id || !dataset?.storageUri) {
    const err = new Error('Dataset inválido para solicitud de data plane');
    err.status = 400;
    err.code = 'INVALID_CONNECTOR_DATASET_PAYLOAD';
    throw err;
  }

  if (!contract?.id || !consumerId || !action) {
    const err = new Error('Solicitud de data plane incompleta para conector');
    err.status = 400;
    err.code = 'INVALID_CONNECTOR_ACCESS_PAYLOAD';
    throw err;
  }

  if (!SUPPORTED_DATA_ACTIONS.has(String(action).toLowerCase())) {
    const err = new Error(`Acción no soportada por adapter DSSC: ${action}`);
    err.status = 400;
    err.code = 'UNSUPPORTED_CONNECTOR_ACTION';
    throw err;
  }
}


function ensureMtlsConfigIfEnabled() {
  if (!DSSC_CONNECTOR_MTLS_ENABLED) return;

  if (!DSSC_CONNECTOR_MTLS_CERT_PATH || !DSSC_CONNECTOR_MTLS_KEY_PATH) {
    const err = new Error('mTLS habilitado pero faltan DSSC_CONNECTOR_MTLS_CERT_PATH/DSSC_CONNECTOR_MTLS_KEY_PATH');
    err.status = 500;
    err.code = 'CONNECTOR_MTLS_CONFIG_INVALID';
    throw err;
  }
}

function buildMtlsAgentIfNeeded() {
  if (!DSSC_CONNECTOR_MTLS_ENABLED) {
    return null;
  }

  ensureMtlsConfigIfEnabled();

  return new https.Agent({
    cert: fs.readFileSync(DSSC_CONNECTOR_MTLS_CERT_PATH),
    key: fs.readFileSync(DSSC_CONNECTOR_MTLS_KEY_PATH),
    ca: DSSC_CONNECTOR_MTLS_CA_PATH ? fs.readFileSync(DSSC_CONNECTOR_MTLS_CA_PATH) : undefined,
    rejectUnauthorized: true
  });
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), CONNECTOR_TIMEOUT_MS);

  try {
    const mtlsAgent = buildMtlsAgentIfNeeded();

    return await fetchFn(url, {
      ...options,
      signal: controller.signal,
      agent: mtlsAgent || undefined
    });
  } catch (error) {
    if (error.code === 'CONNECTOR_MTLS_CONFIG_INVALID') {
      throw error;
    }

    if (error.name === 'AbortError') {
      const err = new Error(`Timeout al invocar conector DSSC (${CONNECTOR_TIMEOUT_MS}ms)`);
      err.status = 504;
      err.code = 'CONNECTOR_TIMEOUT';
      throw err;
    }

    const err = new Error(error.message || 'Error de red al invocar conector DSSC');
    err.status = 502;
    err.code = 'CONNECTOR_NETWORK_ERROR';
    throw err;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function isRetryableConnectorError(error) {
  if (!error) return false;
  if (error.code === 'CONNECTOR_TIMEOUT' || error.code === 'CONNECTOR_NETWORK_ERROR') return true;
  if (error.code === 'CONNECTOR_UPSTREAM_ERROR' && error.upstreamStatus >= 500) return true;
  if (error.status && error.status >= 500) return true;
  return false;
}

function computeBackoffWithJitter(attempt) {
  const exp = CONNECTOR_RETRY_BASE_MS * (2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * CONNECTOR_RETRY_BASE_MS);
  return exp + jitter;
}

function enqueuePendingOperation({ operation, payload, context, reason }) {
  if (pendingOperations.length >= MAX_PENDING_OPERATIONS) {
    pendingOperations.shift();
  }

  pendingOperations.push({
    id: `pending-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    operation,
    payload,
    context,
    reason,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    lastTriedAt: null
  });

  adapterMetrics.queuedForReconcile += 1;
}

function listPendingConnectorOperations() {
  return pendingOperations.map((entry) => ({ ...entry }));
}

async function postToConnector(path, payload, context = {}) {
  if (!CONNECTOR_BASE_URL) {
    const err = new Error('DSSC_CONNECTOR_BASE_URL no configurado para modo DSSC_HTTP');
    err.status = 500;
    throw err;
  }

  ensureCircuitClosed();
  adapterMetrics.calls += 1;

  let attempts = 0;
  let lastError = null;

  while (attempts <= CONNECTOR_RETRY_MAX) {
    attempts += 1;

    try {
      const response = await fetchWithTimeout(`${CONNECTOR_BASE_URL}${path}`, {
        method: 'POST',
        headers: getConnectorHeaders(context),
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const err = new Error(data?.error || `Error en conector DSSC (${response.status})`);
        err.status = 502;
        err.code = 'CONNECTOR_UPSTREAM_ERROR';
        err.upstreamStatus = response.status;
        throw err;
      }

      trackConnectorSuccess();
      return {
        data,
        attempts
      };
    } catch (error) {
      lastError = error;
      trackConnectorFailure();

      if (!isRetryableConnectorError(error) || attempts > CONNECTOR_RETRY_MAX) {
        break;
      }

      adapterMetrics.retries += 1;
      await sleep(computeBackoffWithJitter(attempts));
    }
  }

  throw lastError;
}

function validateControlPlaneResponse(data, operation) {
  if (!data || typeof data !== 'object') {
    const err = new Error(`Respuesta inválida del conector para operación ${operation}`);
    err.status = 502;
    err.code = 'CONNECTOR_INVALID_RESPONSE';
    throw err;
  }
}

function normalizeConnectorResponseData(rawData = {}) {
  if (!rawData || typeof rawData !== 'object') {
    return {};
  }

  if (rawData.result && typeof rawData.result === 'object') {
    return rawData.result;
  }

  if (rawData.data && typeof rawData.data === 'object') {
    return rawData.data;
  }

  return rawData;
}

function validateDataPlaneResponse(data) {
  if (!data || typeof data !== 'object') {
    const err = new Error('Respuesta inválida del conector DSSC: endpoint ausente');
    err.status = 502;
    err.code = 'CONNECTOR_INVALID_RESPONSE';
    throw err;
  }

  const endpoint = data.endpoint || data.accessEndpoint || data.url;
  if (!endpoint) {
    const err = new Error('Respuesta inválida del conector DSSC: endpoint ausente');
    err.status = 502;
    err.code = 'CONNECTOR_INVALID_RESPONSE';
    throw err;
  }
}

function buildContractPayload(contract) {
  validateContractPayload(contract);

  return {
    contractId: contract.id,
    providerId: contract.providerId,
    consumerId: contract.consumerId,
    datasetId: contract.datasetId,
    status: contract.status,
    effectiveFrom: contract.effectiveFrom,
    effectiveTo: contract.effectiveTo,
    odrlPolicy: contract.odrlPolicy || null
  };
}

async function syncContractToConnector(contract, context = {}) {
  if (CONNECTOR_MODE !== 'DSSC_HTTP') {
    return {
      mode: CONNECTOR_MODE,
      synced: false,
      message: 'Sincronización local; no se invoca conector externo'
    };
  }

  const payload = buildContractPayload(contract);
  const operation = 'control-plane.contract.sync';
  const connectorPayload = DSSC_CONNECTOR_PROFILE === 'DSSC_V1'
    ? {
        contract: payload,
        negotiationContext: {
          requestId: context.requestId || null
        }
      }
    : payload;

  try {
    const connectorResponse = await postToConnector(DSSC_CONNECTOR_SYNC_PATH, connectorPayload, normalizeConnectorContext({
      ...context,
      idempotencyKey: context.idempotencyKey || `sync-contract-${contract.id}`
    }, operation));

    validateControlPlaneResponse(connectorResponse.data, operation);

    return {
      mode: CONNECTOR_MODE,
      synced: true,
      attempts: connectorResponse.attempts,
      adapterMeta: buildAdapterMeta(operation, connectorResponse.attempts),
      result: connectorResponse.data
    };
  } catch (error) {
    enqueuePendingOperation({ operation, payload: connectorPayload, context, reason: error.code || error.message });
    throw error;
  }
}

async function revokeContractInConnector(contract, context = {}) {
  if (CONNECTOR_MODE !== 'DSSC_HTTP') {
    return {
      mode: CONNECTOR_MODE,
      revoked: false,
      message: 'Revocación local; no se invoca conector externo'
    };
  }

  validateContractPayload(contract);

  const operation = 'control-plane.contract.revoke';
  const payload = {
    contractId: contract.id,
    datasetId: contract.datasetId,
    consumerId: contract.consumerId
  };
  const connectorPayload = DSSC_CONNECTOR_PROFILE === 'DSSC_V1'
    ? {
        contractRevoke: payload,
        negotiationContext: {
          requestId: context.requestId || null
        }
      }
    : payload;

  try {
    const connectorResponse = await postToConnector(DSSC_CONNECTOR_REVOKE_PATH, connectorPayload, normalizeConnectorContext({
      ...context,
      idempotencyKey: context.idempotencyKey || `revoke-contract-${contract.id}`
    }, operation));

    validateControlPlaneResponse(connectorResponse.data, operation);

    return {
      mode: CONNECTOR_MODE,
      revoked: true,
      attempts: connectorResponse.attempts,
      adapterMeta: buildAdapterMeta(operation, connectorResponse.attempts),
      result: connectorResponse.data
    };
  } catch (error) {
    enqueuePendingOperation({ operation, payload: connectorPayload, context, reason: error.code || error.message });
    throw error;
  }
}

async function requestDataPlaneAccess(input, context = {}) {
  validateDataPlanePayload(input);

  const { dataset, contract, consumerId, purpose, action } = input;

  if (CONNECTOR_MODE !== 'DSSC_HTTP') {
    return {
      mode: CONNECTOR_MODE,
      transport: 'DIRECT',
      endpoint: dataset.storageUri,
      token: null,
      expiresAt: null,
      attempts: 0,
      adapterMeta: buildAdapterMeta('data-plane.access.request', 0)
    };
  }

  const operation = 'data-plane.access.request';
  const requestPayload = {
    contractId: contract.id,
    datasetId: dataset.id,
    consumerId,
    purpose,
    action
  };
  const connectorPayload = DSSC_CONNECTOR_PROFILE === 'DSSC_V1'
    ? {
        accessRequest: requestPayload,
        dataset: {
          id: dataset.id,
          storageUri: dataset.storageUri
        }
      }
    : requestPayload;

  const connectorResponse = await postToConnector(DSSC_CONNECTOR_ACCESS_PATH, connectorPayload, normalizeConnectorContext({
    ...context,
    idempotencyKey: context.idempotencyKey || `data-access-${contract.id}-${dataset.id}-${consumerId}-${action}`
  }, operation));

  const result = normalizeConnectorResponseData(connectorResponse.data || {});
  validateDataPlaneResponse(result);

  return {
    mode: CONNECTOR_MODE,
    transport: result.transport || 'CONNECTOR_PROXY',
    endpoint: result.endpoint || result.accessEndpoint || result.url,
    token: result.token || result.accessToken || null,
    expiresAt: result.expiresAt || null,
    attempts: connectorResponse.attempts,
    adapterMeta: buildAdapterMeta(operation, connectorResponse.attempts)
  };
}

async function retryPendingConnectorOperations(limit = 20) {
  const max = Math.max(1, Number(limit) || 20);
  const snapshot = pendingOperations.slice(0, max);
  let retried = 0;
  let succeeded = 0;

  for (const item of snapshot) {
    retried += 1;
    item.retryCount += 1;
    item.lastTriedAt = new Date().toISOString();

    try {
      if (item.operation === 'control-plane.contract.sync') {
        await postToConnector(DSSC_CONNECTOR_SYNC_PATH, item.payload, normalizeConnectorContext(item.context || {}, item.operation));
      } else if (item.operation === 'control-plane.contract.revoke') {
        await postToConnector(DSSC_CONNECTOR_REVOKE_PATH, item.payload, normalizeConnectorContext(item.context || {}, item.operation));
      } else {
        continue;
      }

      const idx = pendingOperations.findIndex((entry) => entry.id === item.id);
      if (idx >= 0) {
        pendingOperations.splice(idx, 1);
      }
      succeeded += 1;
    } catch (error) {
      item.reason = error.code || error.message;
    }
  }

  return {
    retried,
    succeeded,
    pending: pendingOperations.length
  };
}

async function getConnectorStatus() {
  if (CONNECTOR_MODE !== 'DSSC_HTTP') {
    return {
      mode: CONNECTOR_MODE,
      healthy: true,
      details: 'Modo local sin dependencia de conector externo',
      circuitBreaker: {
        failures: connectorCircuitState.failures,
        open: false,
        openUntil: null
      },
      metrics: adapterMetrics,
      pendingOperations: pendingOperations.length,
      trust: {
        mtlsEnabled: DSSC_CONNECTOR_MTLS_ENABLED
      }
    };
  }

  if (!CONNECTOR_BASE_URL) {
    return {
      mode: CONNECTOR_MODE,
      healthy: false,
      details: 'Falta DSSC_CONNECTOR_BASE_URL',
      metrics: adapterMetrics,
      pendingOperations: pendingOperations.length,
      trust: {
        mtlsEnabled: DSSC_CONNECTOR_MTLS_ENABLED
      }
    };
  }

  try {
    const response = await fetchWithTimeout(`${CONNECTOR_BASE_URL}${DSSC_CONNECTOR_HEALTH_PATH}`, {
      headers: getConnectorHeaders()
    });

    return {
      mode: CONNECTOR_MODE,
      healthy: response.ok,
      statusCode: response.status,
      circuitBreaker: {
        failures: connectorCircuitState.failures,
        open: connectorCircuitState.openUntil > nowMs(),
        openUntil: connectorCircuitState.openUntil > 0 ? new Date(connectorCircuitState.openUntil).toISOString() : null
      },
      metrics: adapterMetrics,
      pendingOperations: pendingOperations.length,
      trust: {
        mtlsEnabled: DSSC_CONNECTOR_MTLS_ENABLED
      },
      interoperability: {
        profile: DSSC_CONNECTOR_PROFILE,
        paths: {
          sync: DSSC_CONNECTOR_SYNC_PATH,
          revoke: DSSC_CONNECTOR_REVOKE_PATH,
          access: DSSC_CONNECTOR_ACCESS_PATH,
          health: DSSC_CONNECTOR_HEALTH_PATH
        },
        authMode: DSSC_CONNECTOR_AUTH_MODE
      }
    };
  } catch (error) {
    return {
      mode: CONNECTOR_MODE,
      healthy: false,
      details: error.message,
      circuitBreaker: {
        failures: connectorCircuitState.failures,
        open: connectorCircuitState.openUntil > nowMs(),
        openUntil: connectorCircuitState.openUntil > 0 ? new Date(connectorCircuitState.openUntil).toISOString() : null
      },
      metrics: adapterMetrics,
      pendingOperations: pendingOperations.length,
      trust: {
        mtlsEnabled: DSSC_CONNECTOR_MTLS_ENABLED
      },
      interoperability: {
        profile: DSSC_CONNECTOR_PROFILE,
        paths: {
          sync: DSSC_CONNECTOR_SYNC_PATH,
          revoke: DSSC_CONNECTOR_REVOKE_PATH,
          access: DSSC_CONNECTOR_ACCESS_PATH,
          health: DSSC_CONNECTOR_HEALTH_PATH
        },
        authMode: DSSC_CONNECTOR_AUTH_MODE
      }
    };
  }
}

module.exports = {
  syncContractToConnector,
  revokeContractInConnector,
  requestDataPlaneAccess,
  getConnectorStatus,
  listPendingConnectorOperations,
  retryPendingConnectorOperations
};
