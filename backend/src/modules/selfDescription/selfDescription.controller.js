const { buildSelfDescription } = require('./selfDescription.service');

async function getSelfDescriptionController(req, res, next) {
  try {
    const payload = await buildSelfDescription();
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSelfDescriptionController
};
