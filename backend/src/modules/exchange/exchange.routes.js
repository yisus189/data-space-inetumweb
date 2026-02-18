const express = require('express');
const {
  accessDatasetController,
  proxyExternalApiController
} = require('./exchange.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

// Solo consumers autenticados con contrato activo pueden acceder
router.get(
  '/datasets/:id/download',
  requireAuth,
  requireRole(['CONSUMER']),
  accessDatasetController
);

// Endpoint opcional para proxy de EXTERNAL_API
router.get(
  '/datasets/:id/proxy',
  requireAuth,
  requireRole(['CONSUMER']),
  proxyExternalApiController
);

module.exports = router;