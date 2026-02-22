const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { getSelfDescriptionController } = require('./selfDescription.controller');

const router = express.Router();

// Endpoint principal de self-description del data space
router.get('/', requireAuth, getSelfDescriptionController);

module.exports = router;
