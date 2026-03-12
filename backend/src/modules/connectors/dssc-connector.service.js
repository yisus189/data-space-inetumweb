const fetch = require('node-fetch');

const CONNECTOR_MODE = (process.env.DATASPACE_CONNECTOR_MODE || 'LOCAL_ENFORCEMENT').toUpperCase();
const CONNECTOR_BASE_URL = process.env.DSSC_CONNECTOR_BASE_URL || null;
const CONNECTOR_API_KEY = process.env.DSSC_CONNECTOR_API_KEY || null;
const CONNECTOR_TIMEOUT_MS = Number(process.env.DSSC_CONNECTOR_TIMEOUT_MS || 5000);
const CONNECTOR_RETRY_MAX = Number(process.env.DSSC_CONNECTOR_RETRY_MAX || 2);
const CIRCUIT_BREAKER_THRESHOLD = Number(process.env.DSSC_CONNECTOR_CIRCUIT_BREAKER_THRESHOLD || 5);
const CIRCUIT_BREAKER_COOLDOWN_MS = Number(process.env.DSSC_CONNECTOR_CIRCUIT_BREAKER_COOLDOWN_MS || 30000);

const connectorCircuitState = {
  failures: 0,
  openUntil: 0
};

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
}

function trackConnectorFailure() {
  connectorCircuitState.failures += 1;
  if (connectorCircuitState.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    connectorCircuitState.openUntil = nowMs() + CIRCUIT_BREAKER_COOLDOWN_MS;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getConnectorHeaders(context = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (CONNECTOR_API_KEY) {
    headers.Authorization = `Bearer ${CONNECTOR_API_KEY}`;
  }

  if (context.requestId) {
    headers['X-Request-Id'] = context.requestId;
  }

  if (context.idempotencyKey) {
    headers['Idempotency-Key'] = context.idempotencyKey;
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
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), CONNECTOR_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      const err = new Error(`Timeout al invocar conector DSSC (${CONNECTOR_TIMEOUT_MS}ms)`);
      err.status = 504;
      err.code = 'CONNECTOR_TIMEOUT';
      throw err;
    }

    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function postToConnector(path, payload, context = {}) {
  if (!CONNECTOR_BASE_URL) {
    const err = new Error('DSSC_CONNECTOR_BASE_URL no configurado para modo DSSC_HTTP');
    err.status = 500;
    throw err;
  }

  ensureCircuitClosed();

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

      const retryable = !error.status || error.status >= 500;
      if (!retryable || attempts > CONNECTOR_RETRY_MAX) {
        break;
      }

      await sleep(150 * attempts);
    }
  }

  throw lastError;
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
  const connectorResponse = await postToConnector('/control-plane/contracts/sync', payload, {
    ...context,
    idempotencyKey: context.idempotencyKey || `sync-contract-${contract.id}`
  });

  return {
    mode: CONNECTOR_MODE,
    synced: true,
    attempts: connectorResponse.attempts,
    result: connectorResponse.data
  };
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

  const connectorResponse = await postToConnector('/control-plane/contracts/revoke', {
    contractId: contract.id,
    datasetId: contract.datasetId,
    consumerId: contract.consumerId
  }, {
    ...context,
    idempotencyKey: context.idempotencyKey || `revoke-contract-${contract.id}`
  });

  return {
    mode: CONNECTOR_MODE,
    revoked: true,
    attempts: connectorResponse.attempts,
    result: connectorResponse.data
  };
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
      attempts: 0
    };
  }

  const connectorResponse = await postToConnector('/data-plane/access/request', {
    contractId: contract.id,
    datasetId: dataset.id,
    consumerId,
    purpose,
    action
  }, {
    ...context,
    idempotencyKey: context.idempotencyKey || `data-access-${contract.id}-${dataset.id}-${consumerId}-${action}`
  });

  const result = connectorResponse.data || {};
  if (!result.endpoint) {
    const err = new Error('Respuesta inválida del conector DSSC: endpoint ausente');
    err.status = 502;
    err.code = 'CONNECTOR_INVALID_RESPONSE';
    throw err;
  }

  return {
    mode: CONNECTOR_MODE,
    transport: result.transport || 'CONNECTOR_PROXY',
    endpoint: result.endpoint,
    token: result.token || null,
    expiresAt: result.expiresAt || null,
    attempts: connectorResponse.attempts
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
      }
    };
  }

  if (!CONNECTOR_BASE_URL) {
    return {
      mode: CONNECTOR_MODE,
      healthy: false,
      details: 'Falta DSSC_CONNECTOR_BASE_URL'
    };
  }

  try {
    const response = await fetchWithTimeout(`${CONNECTOR_BASE_URL}/health`, {
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
      }
    };
  }
}

module.exports = {
  syncContractToConnector,
  revokeContractInConnector,
  requestDataPlaneAccess,
  getConnectorStatus
};
