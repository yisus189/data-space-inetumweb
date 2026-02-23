const {
  prepareDatasetAccess,
  proxyExternalApi
} = require('./exchange.service');

/**
 * Controlador para acceder a un dataset.
 * - Si es FILE: descarga el archivo.
 * - Si es EXTERNAL_API: devuelve JSON con la URL externa.
 */
async function accessDatasetController(req, res, next) {
  try {
    const datasetId = parseInt(req.params.id, 10);
    const user = req.user;

    const clientInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || ''
    };

    const accessContext = {
      action: req.query.action,
      purpose: req.query.purpose
    };

    const result = await prepareDatasetAccess(user, datasetId, clientInfo, accessContext);

    if (result.mode === 'FILE') {
      return res.download(result.filePath, result.suggestedFilename);
    }

    if (result.mode === 'EXTERNAL_API') {
      // Opción 1: devolvemos la URL para que el frontend decida qué hacer
      return res.json({
        mode: 'EXTERNAL_API',
        externalUrl: result.externalUrl
      });
    }

    // Si llegamos aquí es que prepareDatasetAccess devolvió algo inesperado
    return res
      .status(500)
      .json({ error: 'Modo de acceso desconocido en dataset' });
  } catch (err) {
    next(err);
  }
}

/**
 * Controlador de proxy para EXTERNAL_API (opcional).
 * - El frontend puede llamar a /exchange/datasets/:id/proxy
 *   para que el backend haga de puente.
 */
async function proxyExternalApiController(req, res, next) {
  try {
    const datasetId = parseInt(req.params.id, 10);
    const user = req.user;

    const clientInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || ''
    };

    const accessContext = {
      action: req.query.action,
      purpose: req.query.purpose
    };

    const result = await prepareDatasetAccess(user, datasetId, clientInfo, accessContext);

    if (result.mode !== 'EXTERNAL_API') {
      return res
        .status(400)
        .json({ error: 'Este dataset no es de tipo EXTERNAL_API' });
    }

    // Aquí usamos la función de proxy, que vuelve a usar dataset.storageUri
    // Preparamos dataset real para proxyExternalApi llamando de nuevo a DB
    const prisma = require('../../config/db');
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId }
    });

    return proxyExternalApi(dataset, res);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  accessDatasetController,
  proxyExternalApiController
};