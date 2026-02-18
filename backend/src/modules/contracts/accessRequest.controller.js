const service = require('./accessRequest.service');

async function createAccessRequestController(req, res, next) {
  try {
    const consumerId = req.user.id;
    const ar = await service.createAccessRequest(consumerId, req.body);
    res.status(201).json(ar);
  } catch (err) {
    next(err);
  }
}

async function listMyAccessRequestsController(req, res, next) {
  try {
    const consumerId = req.user.id;
    const list = await service.listMyAccessRequests(consumerId);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function listAccessRequestsForProviderController(req, res, next) {
  try {
    const providerId = req.user.id;
    const list = await service.listAccessRequestsForProvider(providerId);
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function approveAccessRequestController(req, res, next) {
  try {
    const providerId = req.user.id;
    const requestId = parseInt(req.params.id, 10);
    const { providerComment, contractTextOverride } = req.body;

    const updated = await service.approveAccessRequest(
      providerId,
      requestId,
      providerComment,
      contractTextOverride
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function rejectAccessRequestController(req, res, next) {
  try {
    const providerId = req.user.id;
    const requestId = parseInt(req.params.id, 10);
    const { providerComment } = req.body;

    const updated = await service.rejectAccessRequest(
      providerId,
      requestId,
      providerComment
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function cancelAccessRequestController(req, res, next) {
  try {
    const consumerId = req.user.id;
    const requestId = parseInt(req.params.id, 10);

    const updated = await service.cancelAccessRequest(consumerId, requestId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function consumerSendCounterOfferController(req, res, next) {
  try {
    const consumerId = req.user.id;
    const requestId = parseInt(req.params.id, 10);
    const { consumerComment, agreedPurpose, agreedDuration, agreedScope } =
      req.body;

    const updated = await service.consumerSendCounterOffer(consumerId, requestId, {
      consumerComment,
      agreedPurpose,
      agreedDuration,
      agreedScope
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// Provider aprueba la propuesta final del consumer
async function providerApproveFinalController(req, res, next) {
  try {
    const providerId = req.user.id;
    const requestId = parseInt(req.params.id, 10);

    const updated = await service.providerApproveFinal(providerId, requestId);

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function providerSendCounterOfferController(req, res, next) {
  try {
    const providerId = req.user.id;
    const requestId = parseInt(req.params.id, 10);
    const {
      providerComment,
      agreedPurpose,
      agreedDuration,
      agreedScope,
      contractTextOverride
    } = req.body;

    const updated = await service.providerSendCounterOffer(
      providerId,
      requestId,
      {
        providerComment,
        agreedPurpose,
        agreedDuration,
        agreedScope,
        contractTextOverride
      }
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function consumerAcceptCounterOfferController(req, res, next) {
  try {
    const consumerId = req.user.id;
    const requestId = parseInt(req.params.id, 10);

    const updated = await service.consumerAcceptCounterOffer(
      consumerId,
      requestId
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function listMyAccessRequestsAsConsumerController(req, res, next) {
  try {
    const consumerId = req.user.id; // viene del JWT en requireAuth
    const requests = await service.listMyAccessRequestsAsConsumer(consumerId);
    res.json(requests);
  } catch (err) {
    next(err);
  }
}


module.exports = {
  createAccessRequestController,
  listAccessRequestsForProviderController,
  rejectAccessRequestController,
  providerSendCounterOfferController,
  consumerAcceptCounterOfferController,
  listMyAccessRequestsAsConsumerController
};