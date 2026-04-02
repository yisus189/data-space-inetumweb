const express = require('express');
const {
  listExternalDatasetsController,
  syncExternalMockController,
  syncExternalConnectorMockController,
  exportConnectorAssetsController
} = require('./externalDataset.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

// Cualquiera autenticado puede ver el catálogo externo, si quieres
router.get('/', requireAuth, listExternalDatasetsController);

// Solo Operator puede lanzar sincronización
router.post('/sync-mock', requireAuth, requireRole(['OPERATOR']), syncExternalMockController);
router.post('/sync-connector-mock', requireAuth, requireRole(['OPERATOR']), syncExternalConnectorMockController);
router.get('/export-connector-assets', requireAuth, requireRole(['PROVIDER', 'OPERATOR']), exportConnectorAssetsController);

module.exports = router;