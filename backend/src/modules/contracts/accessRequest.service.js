const prisma = require('../../config/db');

/**
 * Consumer crea solicitud de acceso a un dataset publicado.
 */
async function createAccessRequest(consumerId, data) {
  const { datasetId, negotiationTypeId, requestedPurpose, requestedDuration, requestedScope, consumerComment } = data;

  if (!datasetId) {
    const err = new Error('datasetId es obligatorio');
    err.status = 400;
    throw err;
  }

  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId }
  });

  if (!dataset || !dataset.published) {
    const err = new Error('Dataset no existe o no está publicado');
    err.status = 400;
    throw err;
  }

  // Evitar solicitudes duplicadas pendentes para mismo dataset/consumer si quieres:
  const existingPending = await prisma.accessRequest.findFirst({
    where: {
      datasetId,
      consumerId,
      status: 'PENDING'
    }
  });

  if (existingPending) {
    const err = new Error('Ya existe una solicitud pendiente para este dataset');
    err.status = 400;
    throw err;
  }

  const ar = await prisma.accessRequest.create({
    data: {
      datasetId,
      consumerId,
      negotiationTypeId: negotiationTypeId || null,
      requestedPurpose,
      requestedDuration,
      requestedScope,
      consumerComment
    }
  });

  return ar;
}

/**
 * Consumer ve sus solicitudes.
 */
async function listMyAccessRequests(consumerId) {
  return prisma.accessRequest.findMany({
    where: { consumerId },
    include: {
      dataset: {
        select: {
          id: true,
          name: true
        }
      },
      negotiationType: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Provider ve solicitudes a sus datasets.
 */
async function listAccessRequestsForProvider(providerId) {
  return prisma.accessRequest.findMany({
    where: {
      dataset: {
        providerId
      }
    },
    include: {
      dataset: {
        select: { id: true, name: true }
      },
      consumer: {
        select: {
          id: true,
          name: true,
          email: true,
          orgUnit: true
        }
      },
      negotiationType: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function listMyAccessRequestsAsConsumer(consumerId) {
  return prisma.accessRequest.findMany({
    where: {
      consumerId
    },
    include: {
      dataset: {
        select: {
          id: true,
          name: true,
          providerId: true,
          provider: {
            select: {
              id: true,
              name: true,
              email: true,
              orgUnit: true
            }
          }
        }
      },
      // Puedes incluir también el consumer, aunque lo conocemos por consumerId
      consumer: {
        select: {
          id: true,
          name: true,
          email: true,
          orgUnit: true
        }
      },
      negotiationType: {
        select: {
          id: true,
          name: true,
          description: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Provider aprueba solicitud -> crea contrato.
 */
async function approveAccessRequest(
  providerId,
  requestId,
  providerComment,
  contractTextOverride,
  agreedDuration,
  agreedScope,
  agreedPurpose
) {
  const ar = await prisma.accessRequest.findUnique({
    where: { id: requestId },
    include: {
      dataset: true,
      negotiationType: true,
      consumer: true
    }
  });

  if (!ar) {
    const err = new Error('AccessRequest no encontrada');
    err.status = 404;
    throw err;
  }

  if (ar.dataset.providerId !== providerId) {
    const err = new Error('No puedes aprobar solicitudes de datasets que no son tuyos');
    err.status = 403;
    throw err;
  }

  if (ar.status !== 'PENDING') {
    const err = new Error('Solo se pueden aprobar solicitudes PENDING');
    err.status = 400;
    throw err;
  }

  const now = new Date();
  const effectiveFrom = now;
  const effectiveTo = null; // podrías calcularlo a partir de agreedDuration

  const baseTemplate =
    ar.negotiationType?.defaultContractTemplate ||
    'Contrato estándar de uso de datos.';

  const finalContractText = contractTextOverride || baseTemplate;

  const updatedAR = await prisma.$transaction(async (tx) => {
    const updatedReq = await tx.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        providerComment,
        approvedAt: now,
        agreedDuration: agreedDuration ?? ar.requestedDuration,
        agreedScope: agreedScope ?? ar.requestedScope,
        agreedPurpose: agreedPurpose ?? ar.requestedPurpose
      }
    });

    await tx.contract.create({
      data: {
        accessRequestId: requestId,
        datasetId: ar.datasetId,
        providerId: providerId,
        consumerId: ar.consumerId,
        contractText: finalContractText,
        effectiveFrom,
        effectiveTo,
        status: 'ACTIVE'
      }
    });

    return updatedReq;
  });

  return updatedAR;
}

async function approveAccessRequestController(req, res, next) {
  try {
    const providerId = req.user.id;
    const requestId = parseInt(req.params.id, 10);
    const {
      providerComment,
      contractTextOverride,
      agreedDuration,
      agreedScope,
      agreedPurpose
    } = req.body;

    const updated = await service.approveAccessRequest(
      providerId,
      requestId,
      providerComment,
      contractTextOverride,
      agreedDuration,
      agreedScope,
      agreedPurpose
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Provider rechaza solicitud.
 */
async function rejectAccessRequest(providerId, requestId, providerComment) {
  const ar = await prisma.accessRequest.findUnique({
    where: { id: requestId },
    include: {
      dataset: true
    }
  });

  if (!ar) {
    const err = new Error('AccessRequest no encontrada');
    err.status = 404;
    throw err;
  }

  if (ar.dataset.providerId !== providerId) {
    const err = new Error('No puedes rechazar solicitudes de datasets que no son tuyos');
    err.status = 403;
    throw err;
  }

  if (ar.status !== 'PENDING') {
    const err = new Error('Solo se pueden rechazar solicitudes PENDING');
    err.status = 400;
    throw err;
  }

  const now = new Date();

  const updated = await prisma.accessRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      providerComment,
      rejectedAt: now
    }
  });

  return updated;
}


async function providerSendCounterOffer(
  providerId,
  requestId,
  { providerComment, agreedPurpose, agreedDuration, agreedScope, contractTextDraft }
) {
  const ar = await prisma.accessRequest.findUnique({
    where: { id: requestId },
    include: { dataset: true, negotiationType: true }
  });

  if (!ar) {
    const err = new Error('AccessRequest no encontrada');
    err.status = 404;
    throw err;
  }

  if (ar.dataset.providerId !== providerId) {
    const err = new Error('No puedes negociar solicitudes de datasets que no son tuyos');
    err.status = 403;
    throw err;
  }

  if (!['PENDING', 'COUNTER_FROM_CONSUMER'].includes(ar.status)) {
    const err = new Error('Solo puedes enviar contraoferta en estados PENDING');
    err.status = 400;
    throw err;
  }

  const updated = await prisma.accessRequest.update({
    where: { id: requestId },
    data: {
      status: 'COUNTER_FROM_PROVIDER',
      providerComment,
      agreedPurpose: agreedPurpose ?? ar.agreedPurpose ?? ar.requestedPurpose,
      agreedDuration: agreedDuration ?? ar.agreedDuration ?? ar.requestedDuration,
      agreedScope: agreedScope ?? ar.agreedScope ?? ar.requestedScope,
      // podrías guardar contractTextDraft en otro campo (ej. proposedContractText)
    }
  });

  return updated;
}

async function consumerAcceptCounterOffer(consumerId, requestId) {
  const ar = await prisma.accessRequest.findUnique({
    where: { id: requestId },
    include: {
      dataset: true,
      negotiationType: true,
      consumer: true
    }
  });

  if (!ar) {
    const err = new Error('AccessRequest no encontrada');
    err.status = 404;
    throw err;
  }

  if (ar.consumerId !== consumerId) {
    const err = new Error('No puedes aceptar solicitudes de otros consumidores');
    err.status = 403;
    throw err;
  }

  if (ar.status !== 'COUNTER_FROM_PROVIDER') {
    const err = new Error('Solo puedes aceptar contraofertas del Provider');
    err.status = 400;
    throw err;
  }

  const now = new Date();

  const baseTemplate =
    ar.negotiationType?.defaultContractTemplate ||
    'Contrato estándar de uso de datos.';

  const finalContractText = baseTemplate; // o usa un campo draft si lo guardas

  const updated = await prisma.$transaction(async (tx) => {
    const updatedReq = await tx.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedAt: now
      }
    });

    await tx.contract.create({
      data: {
        accessRequestId: requestId,
        datasetId: ar.datasetId,
        providerId: ar.dataset.providerId,
        consumerId: ar.consumerId,
        contractText: finalContractText,
        effectiveFrom: now,
        effectiveTo: null,
        status: 'ACTIVE'
      }
    });

    return updatedReq;
  });

  return updated;
}

// backend/src/modules/contracts/accessRequest.service.js

async function consumerSendCounterOffer(
  consumerId,
  requestId,
  {
    consumerComment,
    agreedPurpose,
    agreedDuration,
    agreedScope
    // si quieres, aquí podrías añadir también un draft de contrato
  }
) {
  const ar = await prisma.accessRequest.findUnique({
    where: { id: requestId },
    include: {
      dataset: true
    }
  });

  if (!ar) {
    const err = new Error('AccessRequest no encontrada');
    err.status = 404;
    throw err;
  }

  if (ar.consumerId !== consumerId) {
    const err = new Error('No puedes negociar solicitudes de otros consumidores');
    err.status = 403;
    throw err;
  }

  // El consumer puede contraofertar cuando:
  // - Está en PENDING (primera propuesta hacia el provider),
  // - O está en COUNTER_FROM_PROVIDER (el provider envió contraoferta).
  if (!['PENDING', 'COUNTER_FROM_PROVIDER'].includes(ar.status)) {
    const err = new Error(
      'Solo puedes enviar contraoferta en estados PENDING o COUNTER_FROM_PROVIDER'
    );
    err.status = 400;
    throw err;
  }

  const updated = await prisma.accessRequest.update({
    where: { id: requestId },
    data: {
      status: 'COUNTER_FROM_CONSUMER',
      consumerComment,
      agreedPurpose:
        agreedPurpose ?? ar.agreedPurpose ?? ar.requestedPurpose,
      agreedDuration:
        agreedDuration ?? ar.agreedDuration ?? ar.requestedDuration,
      agreedScope: agreedScope ?? ar.agreedScope ?? ar.requestedScope
    }
  });

  return updated;
}

// backend/src/modules/contracts/accessRequest.service.js

async function providerApproveFinal(providerId, requestId) {
  const ar = await prisma.accessRequest.findUnique({
    where: { id: requestId },
    include: {
      dataset: true,
      negotiationType: true,
      consumer: true
    }
  });

  if (!ar) {
    const err = new Error('AccessRequest no encontrada');
    err.status = 404;
    throw err;
  }

  if (ar.dataset.providerId !== providerId) {
    const err = new Error(
      'No puedes aprobar solicitudes de datasets que no son tuyos'
    );
    err.status = 403;
    throw err;
  }

  if (ar.status !== 'COUNTER_FROM_CONSUMER') {
    const err = new Error(
      'Solo puedes aprobar en estado COUNTER_FROM_CONSUMER (propuesta final del consumer)'
    );
    err.status = 400;
    throw err;
  }

  const now = new Date();

  const baseTemplate =
    ar.negotiationType?.defaultContractTemplate ||
    'Contrato estándar de uso de datos.';

  // Aquí podrías mezclar plantilla + variables de agreed* si quieres
  const finalContractText = baseTemplate;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedReq = await tx.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedAt: now
      }
    });

    await tx.contract.create({
      data: {
        accessRequestId: requestId,
        datasetId: ar.datasetId,
        providerId: ar.dataset.providerId,
        consumerId: ar.consumerId,
        contractText: finalContractText,
        effectiveFrom: now,
        effectiveTo: null,
        status: 'ACTIVE'
      }
    });

    return updatedReq;
  });

  return updated;
}

/**
 * Consumer puede cancelar su solicitud si está pendiente.
 */
async function cancelAccessRequest(consumerId, requestId) {
  const ar = await prisma.accessRequest.findUnique({
    where: { id: requestId }
  });

  if (!ar) {
    const err = new Error('AccessRequest no encontrada');
    err.status = 404;
    throw err;
  }

  if (ar.consumerId !== consumerId) {
    const err = new Error('No puedes cancelar solicitudes de otros usuarios');
    err.status = 403;
    throw err;
  }

  if (ar.status !== 'PENDING') {
    const err = new Error('Solo se pueden cancelar solicitudes PENDING');
    err.status = 400;
    throw err;
  }

  const updated = await prisma.accessRequest.update({
    where: { id: requestId },
    data: { status: 'CANCELLED' }
  });

  return updated;
}

module.exports = {
  createAccessRequest,
  listMyAccessRequestsAsConsumer,
  listAccessRequestsForProvider,
  rejectAccessRequest,
  providerSendCounterOffer,
  consumerAcceptCounterOffer,
  consumerSendCounterOffer,
  providerApproveFinal,
  rejectAccessRequest,
  providerSendCounterOffer,
  consumerAcceptCounterOffer
};