// frontend/src/api/userApi.js
import http from './httpClient';

// Solo para OPERATOR

export function listAllUsers() {
  return http.get('/users');
}

export function blockUser(id) {
  return http.patch(`/users/${id}/block`, {});
}

export function unblockUser(id) {
  return http.patch(`/users/${id}/unblock`, {});
}

export function deleteUser(id) {
  return http.delete(`/users/${id}`);
}