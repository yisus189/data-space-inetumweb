const path = require('path');
const fs = require('fs');
const prisma = require('../../config/db');
const fetch = require('node-fetch'); // para proxy/streaming
const { validateContractIsCurrentlyUsable } = require('../contracts/contract-validation.service');
const { evaluateOdrlPolicy } = require('./odrl-policy.service');

/**
 * Busca contrato activo para un user y dataset.
 */
async function findActiveContractForUserAndDataset(userId, datasetId) {
  const contract = await prisma.contract.findFirst({
    where: {
      consumerId: userId,
      datasetId
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      accessRequest: true
    }
  });

  return contract;
}

/**
 * Registra un acceso en AccessLog.
 */
async function logAccess({
  userId,
  datasetId,
  contractId,
  action,
  purpose,
  ipAddress,
  userAgent,
  extra
}) {
  return prisma.accessLog.create({
    data: {
      userId,
      datasetId,
      contractId: contractId || null,
      action,
      purpose,
      ipAddress,
      userAgent,
      extra: extra ? JSON.stringify(extra) : null
    }
  });
}

/**
 * Devuelve la ruta absoluta al fichero, dado storageUri.
 * Suponemos que storageUri es relativa a la carpeta backend/storage.
 */
function resolveFilePath(storageUri) {
  const baseDir = path.join(__dirname, '../../..', 'storage');
  return path.join(baseDir, storageUri);
}

/**
 * Preparar descarga de dataset tipo FILE.
 * - Verifica dataset y contrato.
 * - Comprueba que el fichero existe.
 * - Registra acceso DOWNLOAD.
 * - Devuelve { filePath, suggestedFilename }.
 */
async function prepareFileDownload(user, dataset, contract, clientInfo, resolvedPurpose, policyDecision) {
  if (!dataset.storageUri) {
    const err = new Error('El dataset no tiene storageUri configurado');
    err.status = 500;
    throw err;
  }

  const filePath = resolveFilePath(dataset.storageUri);

  if (!fs.existsSync(filePath)) {
    const err = new Error(
      'El fichero asociado al dataset no existe en el servidor'
    );
    err.status = 500;
    throw err;
  }

  await logAccess({
    userId: user.id,
    datasetId: dataset.id,
    contractId: contract.id,
    action: 'DOWNLOAD',
    purpose: resolvedPurpose,
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    extra: { note: 'File download (FILE storageType)', policyDecision: 'ALLOW', matchedRuleType: policyDecision.matchedRuleType }
  });

  const suggestedFilename =
    path.basename(dataset.storageUri) || `${dataset.name}.dat`;

  return { filePath, suggestedFilename };
}

/**
 * Preparar acceso a dataset tipo EXTERNAL_API.
 *
 * Estrategia:
 * - Verifica dataset y contrato.
 * - Registra acceso DOWNLOAD (o API_ACCESS, según lo que prefieras).
 * - Devuelve la URL externa para que el frontend decida:
 *   - Abrirla en nueva pestaña, o
 *   - Hacer un segundo endpoint de proxy.
 */
async function prepareExternalApiAccess(user, dataset, contract, clientInfo, resolvedPurpose, policyDecision) {
  if (!dataset.storageUri) {
    const err = new Error('El dataset no tiene URL externa configurada');
    err.status = 500;
    throw err;
  }

  await logAccess({
    userId: user.id,
    datasetId: dataset.id,
    contractId: contract.id,
    action: 'API_ACCESS',
    purpose: resolvedPurpose,
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    extra: { note: 'External API access (EXTERNAL_API storageType)', policyDecision: 'ALLOW', matchedRuleType: policyDecision.matchedRuleType }
  });

  return {
    externalUrl: dataset.storageUri
  };
}

/**
 * Proxy opcional para EXTERNAL_API:
 * - Llama a la URL externa desde el backend.
 * - Reenvía headers básicos y el cuerpo al consumidor.
 * Esto evita exponer directamente la URL al consumidor, si quieres más control.
 */
async function proxyExternalApi(dataset, res) {
  const url = dataset.storageUri;
  if (!url) {
    res.status(500).json({ error: 'Dataset sin URL externa configurada' });
    return;
  }

  try {
    const upstreamRes = await fetch(url);

    // Copiar status y tipo de contenido
    res.status(upstreamRes.status);
    const contentType = upstreamRes.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Stream de datos
    upstreamRes.body.pipe(res);
  } catch (err) {
    console.error('Error en proxyExternalApi:', err);
    res.status(502).json({ error: 'Error al acceder al recurso externo' });
  }
}



function resolveAccessAction(dataset, accessContext) {
  if (accessContext.action) {
    return accessContext.action;
  }

  if (dataset.storageType === 'EXTERNAL_API') {
    return 'use';
  }

  return 'download';
}
function buildPolicyContext({ user, dataset, contract, action, purpose }) {
  return {
    action,
    purpose,
    now: new Date(),
    assignee: `urn:dataspace:user:${user.id}`,
    assigner: `urn:dataspace:user:${contract.providerId}`,
    target: `urn:dataspace:dataset:${dataset.id}`
  };
}

/**
 * Lógica principal de acceso/descarga de dataset.
 * - Verifica que el dataset existe.
 * - Verifica contrato activo.
 * - Según storageType, devuelve info necesaria:
 *   - FILE: { mode: 'FILE', filePath, suggestedFilename }
 *   - EXTERNAL_API: { mode: 'EXTERNAL_API', externalUrl }
 */
async function prepareDatasetAccess(user, datasetId, clientInfo, accessContext = {}) {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId }
  });

  if (!dataset) {
    const err = new Error('Dataset no encontrado');
    err.status = 404;
    throw err;
  }

  const contract = await findActiveContractForUserAndDataset(
    user.id,
    datasetId
  );

  validateContractIsCurrentlyUsable(contract);

  const action = resolveAccessAction(dataset, accessContext);
  const resolvedPurpose =
    accessContext.purpose ||
    contract.accessRequest?.agreedPurpose ||
    contract.accessRequest?.requestedPurpose ||
    null;

  const policyContext = buildPolicyContext({
    user,
    dataset,
    contract,
    action,
    purpose: resolvedPurpose
  });

  const policyDecision = evaluateOdrlPolicy(contract.odrlPolicy, policyContext);

  if (!policyDecision.allow) {
    await logAccess({
      userId: user.id,
      datasetId: dataset.id,
      contractId: contract.id,
      action: 'POLICY_DENY',
      purpose: resolvedPurpose,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      extra: {
        note: 'Policy denied dataset access',
        policyDecision: 'DENY',
        reason: policyDecision.reason,
        matchedRuleType: policyDecision.matchedRuleType,
        action,
        assignee: policyContext.assignee,
        assigner: policyContext.assigner,
        target: policyContext.target
      }
    });

    const err = new Error(policyDecision.reason);
    err.status = 403;
    throw err;
  }

  if (dataset.status !== 'ACTIVE' || dataset.blocked || !dataset.published) {
    const err = new Error('Dataset no disponible para consumo');
    err.status = 403;
    throw err;
  }

  if (dataset.storageType === 'FILE') {
    const { filePath, suggestedFilename } = await prepareFileDownload(
      user,
      dataset,
      contract,
      clientInfo,
      resolvedPurpose,
      policyDecision
    );
    return {
      mode: 'FILE',
      filePath,
      suggestedFilename
    };
  }

  if (dataset.storageType === 'EXTERNAL_API') {
    const { externalUrl } = await prepareExternalApiAccess(
      user,
      dataset,
      contract,
      clientInfo,
      resolvedPurpose,
      policyDecision
    );
    return {
      mode: 'EXTERNAL_API',
      externalUrl
    };
  }

  // Otros tipos (DB_VIEW, etc.) los puedes manejar aquí en el futuro
  const err = new Error(
    `storageType no soportado todavía: ${dataset.storageType}`
  );
  err.status = 400;
  throw err;
}

module.exports = {
  prepareDatasetAccess,
  proxyExternalApi,
  findActiveContractForUserAndDataset,
  logAccess
};