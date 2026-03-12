const {
  getConnectorStatus,
  listPendingConnectorOperations,
  retryPendingConnectorOperations
} = require('./dssc-connector.service');

async function getConnectorStatusController(req, res, next) {
  try {
    const status = await getConnectorStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
}

async function listPendingConnectorOpsController(req, res, next) {
  try {
    const pending = listPendingConnectorOperations();
    res.json({
      count: pending.length,
      items: pending
    });
  } catch (error) {
    next(error);
  }
}

async function retryPendingConnectorOpsController(req, res, next) {
  try {
    const limit = Number(req.query.limit || 20);
    const result = await retryPendingConnectorOperations(limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getConnectorStatusController,
  listPendingConnectorOpsController,
  retryPendingConnectorOpsController
};
