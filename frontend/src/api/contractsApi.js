// frontend/src/api/contractsApi.js
import http from './httpClient';

// Negotiation types (Operator)
export function listNegotiationTypes() {
  return http.get('/contracts/negotiation-types');
}

export function createNegotiationType(payload) {
  return http.post('/contracts/negotiation-types', payload);
}

export function updateNegotiationType(id, payload) {
  return http.patch(`/contracts/negotiation-types/${id}`, payload);
}

export function deleteNegotiationType(id) {
  return http.delete(`/contracts/negotiation-types/${id}`);
}

// Access requests (Consumer & Provider)
export function createAccessRequest(body) {
  return http.post('/contracts/access-requests', body);
}

export function listMyAccessRequestsAsConsumer() {
  return http.get('/contracts/access-requests/mine-as-consumer');
}

export function listMyAccessRequests() {
  return http.get('/contracts/access-requests/mine');
}

export function cancelAccessRequest(id) {
  return http.patch(`/contracts/access-requests/${id}/cancel`, {});
}

// Provider lista solicitudes sobre sus datasets
export function listAccessRequestsForProvider() {
  return http.get('/contracts/access-requests/for-provider');
}

export function approveAccessRequest(id, payload) {
  return http.patch(`/contracts/access-requests/${id}/approve`, payload);
}

export function rejectAccessRequest(id, payload) {
  return http.patch(`/contracts/access-requests/${id}/reject`, payload);
}

// Contracts
export function listMyContractsAsConsumer() {
  return http.get('/contracts/mine-as-consumer');
}

export function listMyContractsAsProvider() {
  return http.get('/contracts/mine-as-provider');
}

// NUEVO: Provider envía contraoferta
export function providerSendCounterOffer(id, body) {
  return http.post(`/contracts/access-requests/${id}/provider-counter`, body);
}

// NUEVO: Consumer acepta contraoferta del Provider
export function consumerAcceptCounterOffer(id) {
  return http.post(`/contracts/access-requests/${id}/consumer-accept`, {});
}

export function getContractById(id) {
  return http.get(`/contracts/${id}`);
}

// ODRL: obtener política de un contrato
export function getContractOdrlPolicy(contractId) {
  return http.get(`/contracts/${contractId}/odrl-policy`);
}

// ODRL: guardar/actualizar política de un contrato
export function setContractOdrlPolicy(contractId, policy) {
  return http.put(`/contracts/${contractId}/odrl-policy`, policy);
}