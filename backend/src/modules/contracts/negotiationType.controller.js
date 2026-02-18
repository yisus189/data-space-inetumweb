const service = require('./negotiationType.service');

async function listNegotiationTypesController(req, res, next) {
  try {
    const list = await service.listNegotiationTypes();
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function createNegotiationTypeController(req, res, next) {
  try {
    const nt = await service.createNegotiationType(req.body);
    res.status(201).json(nt);
  } catch (err) {
    next(err);
  }
}

async function updateNegotiationTypeController(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const nt = await service.updateNegotiationType(id, req.body);
    res.json(nt);
  } catch (err) {
    next(err);
  }
}

async function deleteNegotiationTypeController(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await service.deleteNegotiationType(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listNegotiationTypesController,
  createNegotiationTypeController,
  updateNegotiationTypeController,
  deleteNegotiationTypeController
};