import http from './httpClient';

export function downloadDataset(id) {
  return http.get(`/exchange/datasets/${id}/download`);
}