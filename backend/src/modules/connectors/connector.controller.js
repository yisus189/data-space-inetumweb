const { getConnectorStatus } = require('./dssc-connector.service');

async function getConnectorStatusController(req, res, next) {
  try {
    const status = await getConnectorStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getConnectorStatusController
};
