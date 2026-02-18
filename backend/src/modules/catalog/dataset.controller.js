const datasetService = require('./dataset.service');

/**
 * Provider crea dataset.
 */
async function createDatasetController(req, res, next) {
  try {
    const providerId = req.user.id;
    const dataset = await datasetService.createDataset(providerId, req.body);
    res.status(201).json(dataset);
  } catch (err) {
    next(err);
  }
}

/**
 * Provider actualiza dataset propio.
 */
async function updateDatasetController(req, res, next) {
  try {
    const providerId = req.user.id;
    const datasetId = parseInt(req.params.id, 10);
    const updated = await datasetService.updateDataset(
      providerId,
      datasetId,
      req.body
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Provider cambia estado publicado/no publicado.
 */
async function publishDatasetController(req, res, next) {
  try {
    const providerId = req.user.id;
    const datasetId = parseInt(req.params.id, 10);
    const { published } = req.body;

    const updated = await datasetService.setDatasetPublished(
      providerId,
      datasetId,
      published
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Provider lista sus datasets.
 */
async function listMyDatasetsController(req, res, next) {
  try {
    const providerId = req.user.id;
    const datasets = await datasetService.listProviderDatasets(providerId);
    res.json(datasets);
  } catch (err) {
    next(err);
  }
}

/**
 * Consumer ve catálogo publicado (listado).
 */
async function listPublishedDatasetsController(req, res, next) {
  try {
    const filters = {
      search: req.query.search || undefined,
      category: req.query.category || undefined,
      providerId: req.query.providerId || undefined
    };

    const datasets = await datasetService.listPublishedDatasets(filters);
    res.json(datasets);
  } catch (err) {
    next(err);
  }
}

/**
 * Detalle de un dataset.
 * Si no está publicado, solo el provider dueño puede verlo.
 */
async function getDatasetByIdController(req, res, next) {
  try {
    const datasetId = parseInt(req.params.id, 10);
    const dataset = await datasetService.getDatasetById(datasetId);

    if (!dataset) {
      const err = new Error('Dataset no encontrado');
      err.status = 404;
      throw err;
    }

    if (!dataset.published) {
      if (!req.user || dataset.providerId !== req.user.id) {
        const err = new Error('No autorizado para ver este dataset');
        err.status = 403;
        throw err;
      }
    }

    res.json(dataset);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createDatasetController,
  updateDatasetController,
  publishDatasetController,
  listMyDatasetsController,
  listPublishedDatasetsController,
  getDatasetByIdController
};