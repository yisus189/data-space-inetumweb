const service = require('./audit.service');

async function listProviderAuditController(req, res, next) {
  try {
    const providerId = req.user.id;
    const filters = {
      datasetId: req.query.datasetId || undefined,
      from: req.query.from || undefined,
      to: req.query.to || undefined
    };
    const logs = await service.listAccessLogsForProvider(providerId, filters);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

async function listGlobalAuditController(req, res, next) {
  try {
    const filters = {
      userId: req.query.userId || undefined,
      datasetId: req.query.datasetId || undefined,
      from: req.query.from || undefined,
      to: req.query.to || undefined
    };
    const logs = await service.listAccessLogsGlobal(filters);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

async function listMyAuditController(req, res, next) {
  try {
    const consumerId = req.user.id;
    const filters = {
      datasetId: req.query.datasetId || undefined,
      from: req.query.from || undefined,
      to: req.query.to || undefined
    };
    const logs = await service.listMyAccessLogs(consumerId, filters);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProviderAuditController,
  listGlobalAuditController,
  listMyAuditController
};