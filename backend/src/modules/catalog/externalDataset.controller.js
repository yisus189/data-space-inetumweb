const externalService = require('./externalDataset.service');

/**
 * Lista datasets externos (por ejemplo, ya sincronizados desde OpenMetadata).
 */
async function listExternalDatasetsController(req, res, next) {
  try {
    const list = await externalService.listExternalDatasets();
    res.json(list);
  } catch (err) {
    next(err);
  }
}

/**
 * Endpoint de sincronización "mock".
 * En un entorno real, aquí llamarías a la API de OpenMetadata,
 * recuperarías sus entries y las pasarías a syncFromOpenMetadata().
 */
async function syncExternalMockController(req, res, next) {
  try {
    const { mockData } = req.body;

    if (!Array.isArray(mockData)) {
      const err = new Error(
        'Se espera un array mockData con entradas para sincronizar'
      );
      err.status = 400;
      throw err;
    }

    const list = await externalService.syncFromOpenMetadata(mockData);
    res.json(list);
  } catch (err) {
    next(err);
  }
}


async function syncExternalConnectorMockController(req, res, next) {
  try {
    const { assets } = req.body;

    if (!Array.isArray(assets)) {
      const err = new Error('Se espera un array assets con entradas del catálogo del conector');
      err.status = 400;
      throw err;
    }

    const result = await externalService.syncFromConnectorCatalog(assets);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listExternalDatasetsController,
  syncExternalMockController,
  syncExternalConnectorMockController
};