const API_URL = 'http://localhost:4001';
import http from './httpClient';

export async function loginApi(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en login');
  return data;
}

export async function registerUser(payload) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en el registro');
  return data;
}

export function listGlobalAudit() {
  return http.get('/audit/global'); // ajusta la ruta a tu backend
}