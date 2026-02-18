const express = require('express');
const {
  listProviderAuditController,
  listGlobalAuditController,
  listMyAuditController
} = require('./audit.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Provider: ver accesos a sus datasets
router.get('/provider', requireRole(['PROVIDER']), listProviderAuditController);

// Operator: ver auditoría global
router.get('/global', requireRole(['OPERATOR']), listGlobalAuditController);

// Consumer: ver sus propios accesos
router.get('/mine', requireRole(['CONSUMER']), listMyAuditController);

module.exports = router;