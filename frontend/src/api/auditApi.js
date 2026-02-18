import http from './httpClient';

// Provider
export function getProviderAudit(params = {}) {
  const query = new URLSearchParams(params).toString();
  const path = query ? `/audit/provider?${query}` : '/audit/provider';
  return http.get(path);
}

// Operator
export function getGlobalAudit(params = {}) {
  const query = new URLSearchParams(params).toString();
  const path = query ? `/audit/global?${query}` : '/audit/global';
  return http.get(path);
}

// Consumer
export function getMyAudit(params = {}) {
  const query = new URLSearchParams(params).toString();
  const path = query ? `/audit/mine?${query}` : '/audit/mine';
  return http.get(path);
}