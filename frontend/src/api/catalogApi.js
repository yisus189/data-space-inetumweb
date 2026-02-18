import http from './httpClient';
const API_URL = 'http://localhost:4001';


// Provider: mis datasets
export function getMyDatasets() {
  return http.get('/catalog/datasets/mine');
}

// Provider: crear dataset
export function createDataset(payload) {
  return http.post('/catalog/datasets', payload);
}

export function createMyDataset(body) {
  return http.post('/catalog/datasets', body);
}

// Provider: actualizar dataset
export function updateDataset(id, payload) {
  return http.patch(`/catalog/datasets/${id}`, payload);
}

// Provider: lista sus datasets
export function listMyDatasets() {
  return http.get('/catalog/datasets/mine');
}

// Provider: actualiza un dataset propio
export function updateMyDataset(id, body) {
  return http.patch(`/catalog/datasets/${id}`, body);
}

// Operator: lista todos los datasets
export function listAllDatasetsAdmin() {
  return http.get('/catalog/datasets/admin');
}

// Operator: bloquear / desbloquear dataset
export function blockDataset(id) {
  return http.patch(`/catalog/datasets/${id}/block`, {});
}

export function unblockDataset(id) {
  return http.patch(`/catalog/datasets/${id}/unblock`, {});
}

// Provider: publicar / despublicar dataset
export function togglePublishDataset(id, shouldPublish) {
  // Depende de cómo hayas diseñado tu backend:
  // opción A: un único endpoint que recibe { published: true/false }
  return http.patch(`/catalog/datasets/${id}/publish`, {
    published: shouldPublish,
  });
}

export async function uploadDatasetFile(file) {
  const token = localStorage.getItem('dataspace_token');
  if (!token) {
    throw new Error('No autenticado');
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/catalog/upload/dataset-file`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
      // No pongas 'Content-Type': 'multipart/form-data'; el navegador lo añade solo
    },
    body: formData
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || 'Error al subir archivo');
    err.status = res.status;
    throw err;
  }

  return data; // tendrá storageUri
}

// Provider: cambiar publicación
export function setDatasetPublished(id, published) {
  return http.patch(`/catalog/datasets/${id}/publish`, { published });
}

// Consumer / público: listar datasets publicados
export function getPublishedDatasets(params = {}) {
  const query = new URLSearchParams(params).toString();
  const path = query ? `/catalog/datasets/public?${query}` : '/catalog/datasets/public';
  return http.get(path);
}

// Detalle dataset
export function getDatasetByIdPublic(id) {
  return http.get(`/catalog/datasets/public/${id}`);
}

// Catálogo externo
export function listExternalDatasets() {
  return http.get('/catalog/external');
}

// Sincronización mock (Operator)
export function syncExternalMock(mockData) {
  return http.post('/catalog/external/sync-mock', { mockData });
}