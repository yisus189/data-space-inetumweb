const fetch = require('node-fetch');

const CONNECTOR_MODE = (process.env.DATASPACE_CONNECTOR_MODE || 'LOCAL_ENFORCEMENT').toUpperCase();
const CONNECTOR_BASE_URL = process.env.DSSC_CONNECTOR_BASE_URL || null;
const CONNECTOR_API_KEY = process.env.DSSC_CONNECTOR_API_KEY || null;

function getConnectorHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (CONNECTOR_API_KEY) {
    headers.Authorization = `Bearer ${CONNECTOR_API_KEY}`;
  }
  return headers;
}

async function postToConnector(path, payload) {
  if (!CONNECTOR_BASE_URL) {
    const err = new Error('DSSC_CONNECTOR_BASE_URL no configurado para modo DSSC_HTTP');
    err.status = 500;
    throw err;
  }

  const response = await fetch(`${CONNECTOR_BASE_URL}${path}`, {
    method: 'POST',
    headers: getConnectorHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(data?.error || `Error en conector DSSC (${response.status})`);
    err.status = 502;
    throw err;
  }

  return data;
}

function buildContractPayload(contract) {
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

async function syncContractToConnector(contract) {
  if (CONNECTOR_MODE !== 'DSSC_HTTP') {
    return {
      mode: CONNECTOR_MODE,
      synced: false,
      message: 'Sincronización local; no se invoca conector externo'
    };
  }

  const payload = buildContractPayload(contract);
  const result = await postToConnector('/control-plane/contracts/sync', payload);

  return {
    mode: CONNECTOR_MODE,
    synced: true,
    result
  };
}

async function revokeContractInConnector(contract) {
  if (CONNECTOR_MODE !== 'DSSC_HTTP') {
    return {
      mode: CONNECTOR_MODE,
      revoked: false,
      message: 'Revocación local; no se invoca conector externo'
    };
  }

  const result = await postToConnector('/control-plane/contracts/revoke', {
    contractId: contract.id,
    datasetId: contract.datasetId,
    consumerId: contract.consumerId
  });

  return {
    mode: CONNECTOR_MODE,
    revoked: true,
    result
  };
}

async function requestDataPlaneAccess({ dataset, contract, consumerId, purpose, action }) {
  if (CONNECTOR_MODE !== 'DSSC_HTTP') {
    return {
      mode: CONNECTOR_MODE,
      transport: 'DIRECT',
      endpoint: dataset.storageUri,
      token: null,
      expiresAt: null
    };
  }

  const result = await postToConnector('/data-plane/access/request', {
    contractId: contract.id,
    datasetId: dataset.id,
    consumerId,
    purpose,
    action
  });

  return {
    mode: CONNECTOR_MODE,
    transport: result.transport || 'CONNECTOR_PROXY',
    endpoint: result.endpoint,
    token: result.token || null,
    expiresAt: result.expiresAt || null
  };
}

async function getConnectorStatus() {
  if (CONNECTOR_MODE !== 'DSSC_HTTP') {
    return {
      mode: CONNECTOR_MODE,
      healthy: true,
      details: 'Modo local sin dependencia de conector externo'
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
    const response = await fetch(`${CONNECTOR_BASE_URL}/health`, {
      headers: getConnectorHeaders()
    });

    return {
      mode: CONNECTOR_MODE,
      healthy: response.ok,
      statusCode: response.status
    };
  } catch (error) {
    return {
      mode: CONNECTOR_MODE,
      healthy: false,
      details: error.message
    };
  }
}

module.exports = {
  syncContractToConnector,
  revokeContractInConnector,
  requestDataPlaneAccess,
  getConnectorStatus
};
