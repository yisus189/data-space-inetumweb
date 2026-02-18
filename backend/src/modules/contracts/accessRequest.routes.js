const express = require('express');
const {
  createAccessRequestController,
  listAccessRequestsForProviderController,
  listMyAccessRequestsAsConsumerController,
  rejectAccessRequestController,
  providerSendCounterOfferController,
  consumerAcceptCounterOfferController
} = require('./accessRequest.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();

// Todas las rutas de este módulo requieren autenticación
router.use(requireAuth);

// ==================== CONSUMER ====================

// Consumer crea solicitud
router.post('/', requireRole(['CONSUMER']), createAccessRequestController);

// Consumer ve sus solicitudes (vista "Mis solicitudes")
router.get(
  '/mine-as-consumer',
  requireRole(['CONSUMER']),
  listMyAccessRequestsAsConsumerController
);

// Consumer acepta la contraoferta del provider
// (estado COUNTER_FROM_PROVIDER -> APPROVED + contrato ACTIVE)
router.post(
  '/:id/consumer-accept',
  requireRole(['CONSUMER']),
  consumerAcceptCounterOfferController
);

// ==================== PROVIDER ====================

// Provider lista solicitudes sobre sus datasets
router.get(
  '/for-provider',
  requireRole(['PROVIDER']),
  listAccessRequestsForProviderController
);

// Provider rechaza una solicitud
router.post(
  '/:id/reject',
  requireRole(['PROVIDER']),
  rejectAccessRequestController
);

// Provider envía contraoferta
// (estado PENDING -> COUNTER_FROM_PROVIDER)
router.post(
  '/:id/provider-counter',
  requireRole(['PROVIDER']),
  providerSendCounterOfferController
);

module.exports = router;