import http from './httpClient';

// CONSUMER / PROVIDER
export function listMySupportConversations() {
  return http.get('/support/my-conversations');
}

export function createSupportConversation(body) {
  // body: { title, initialMessage }
  return http.post('/support/my-conversations', body);
}

// Compartido (user + operator)
export function getSupportConversation(id) {
  return http.get(`/support/conversations/${id}`);
}

export function sendSupportMessage(id, content) {
  return http.post(`/support/conversations/${id}/messages`, { content });
}

// OPERATOR
export function listAllSupportConversations() {
  return http.get('/support/all-conversations');
}