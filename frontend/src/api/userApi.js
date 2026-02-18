// frontend/src/api/userApi.js
import http from './httpClient';

// --- Funciones antiguas (las mantengo para no romper nada) ---

export function listUsers() {
  return http.get('/users');
}

export function listUsersRaw() {
  return http.get('/users'); // devuelve { pending, existing }
}

export function approveUser(id) {
  return http.patch(`/users/${id}/approve`, {});
}

export function rejectUser(id) {
  return http.patch(`/users/${id}/reject`, {});
}

export function createUser(user) {
  return http.post('/users', user);
}

export function updateUserRole(id, role) {
  return http.patch(`/users/${id}/role`, { role });
}

export function updateUserStatus(id, status) {
  return http.patch(`/users/${id}/status`, { status });
}

// --- Funciones nuevas para el panel de operador ---

// Alias de listUsers para usar un nombre más descriptivo en OperatorUsers.jsx
export function listAllUsers() {
  return listUsers();
}

// Bloquear usuario
export function blockUser(id) {
  return http.patch(`/users/${id}/block`, {});
}

// Desbloquear usuario
export function unblockUser(id) {
  return http.patch(`/users/${id}/unblock`, {});
}

// Eliminar usuario
export function deleteUser(id) {
  return http.delete(`/users/${id}`);
}