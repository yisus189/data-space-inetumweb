const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { getConnectorStatusController } = require('./connector.controller');

const router = express.Router();

router.get('/status', requireAuth, requireRole(['OPERATOR']), getConnectorStatusController);

module.exports = router;
