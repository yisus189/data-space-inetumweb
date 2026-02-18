const API_URL = 'http://localhost:4001';

function getToken() {
  return localStorage.getItem('dataspace_token');
}

export async function listPendingUsers() {
  const token = getToken();
  const res = await fetch(`${API_URL}/operator/users?status=PENDING`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cargar usuarios');
  return data;
}

export async function approveUser(id) {
  const token = getToken();
  const res = await fetch(`${API_URL}/operator/users/${id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al aprobar usuario');
  return data;
}

export async function rejectUser(id) {
  const token = getToken();
  const res = await fetch(`${API_URL}/operator/users/${id}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al rechazar usuario');
  return data;
}