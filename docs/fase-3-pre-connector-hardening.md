# Fase 3 Pre-Connector — interfaz, resiliencia y trust operacional

Este documento cierra la preparación previa a la integración del conector DSSC específico del proveedor.

## 1) Validación de completitud de Fase 1 y Fase 2

### Fase 1 (hardening base)
- Validación de contrato vigente y utilizable en acceso (`exchange`).
- Bloqueo de datasets no activos/no publicados/bloqueados.
- Auditoría de accesos y denegaciones.

### Fase 2 avanzada (ODRL)
- Evaluación ODRL en tiempo de acceso.
- Denegación explícita con motivo.
- Registro de `POLICY_DENY` con trazabilidad de regla.

## 2) Interfaz estable de conector (contract-first)

Se endurece el adapter con validaciones de payload:
- `syncContractToConnector`: exige `id`, `providerId`, `consumerId`, `datasetId`.
- `requestDataPlaneAccess`: exige `dataset.id`, `dataset.storageUri`, `contract.id`, `consumerId`, `action`.
- Acciones de data plane soportadas: `use`, `download`, `read`.

Además, el adapter publica contrato de interoperabilidad interno:
- Versión de contrato: `1.0` (metadata `adapterMeta`).
- Headers salientes hacia conector:
  - `X-Adapter-Contract-Version`
  - `X-Connector-Operation`
  - `Idempotency-Key`
  - `X-Request-Id`

Objetivo: evitar acoplamiento débil y fallos silenciosos al recibir el conector real.

## 3) Resiliencia operacional

El adapter incluye:
- Timeout configurable por operación (`DSSC_CONNECTOR_TIMEOUT_MS`).
- Reintentos con backoff exponencial + jitter (`DSSC_CONNECTOR_RETRY_MAX`, `DSSC_CONNECTOR_RETRY_BASE_MS`).
- Clasificación de errores retryable/no-retryable (`CONNECTOR_TIMEOUT`, `CONNECTOR_NETWORK_ERROR`, `CONNECTOR_UPSTREAM_ERROR`).
- Circuit breaker (`DSSC_CONNECTOR_CIRCUIT_BREAKER_THRESHOLD`, `DSSC_CONNECTOR_CIRCUIT_BREAKER_COOLDOWN_MS`).
- Idempotency-Key por operación de control plane/data plane.
- Validación de respuesta del conector por tipo de operación (`control-plane`/`data-plane`).
- Outbox ligera en memoria para operaciones `control-plane` fallidas y reintento manual (`/connector/pending-operations/retry`).
- Métricas operativas del adapter (calls, successes, failures, retries, queuedForReconcile) expuestas en `GET /connector/status`.

## 4) Trust operacional

Se mantiene y declara:
- `JWT` con `kid` y soporte `RS256` con enforcement en producción (`ENFORCE_RS256_IN_PROD`).
- JWKS multi-key para rotación (`JWT_PUBLIC_KEYS_JSON`) y endpoint de metadatos de token.
- Header de correlación `X-Request-Id` en requests/responses.
- mTLS pre-federación en adapter (`DSSC_CONNECTOR_MTLS_ENABLED`) con validación estricta de cert/key.
- Declaración de capacidades trust en self-description y status operacional.

## 5) Variables recomendadas

```env
DATASPACE_CONNECTOR_MODE=DSSC_HTTP
DSSC_CONNECTOR_BASE_URL=https://connector.vendor.example
DSSC_CONNECTOR_API_KEY=***
DSSC_CONNECTOR_TIMEOUT_MS=5000
DSSC_CONNECTOR_RETRY_MAX=2
DSSC_CONNECTOR_RETRY_BASE_MS=150
DSSC_CONNECTOR_CIRCUIT_BREAKER_THRESHOLD=5
DSSC_CONNECTOR_CIRCUIT_BREAKER_COOLDOWN_MS=30000
DSSC_CONNECTOR_MTLS_ENABLED=true
JWT_ALGORITHM=RS256
JWT_KID=inetum-key-2026-01
JWT_PUBLIC_KEYS_JSON=[{"kid":"inetum-key-2026-01","publicKey":"-----BEGIN PUBLIC KEY-----..."}]
ENFORCE_RS256_IN_PROD=true
DSSC_CONNECTOR_MTLS_CERT_PATH=/etc/inetum/connector-client.crt
DSSC_CONNECTOR_MTLS_KEY_PATH=/etc/inetum/connector-client.key
DSSC_CONNECTOR_MTLS_CA_PATH=/etc/inetum/connector-ca.crt
```

## 6) Pruebas clave previas a conector real

- Tests de Fase 1/2 (contrato, dataset, ODRL, POLICY_DENY).
- Tests del adapter (validación de payload + estado de resiliencia + cola de reconciliación).
- Validación de build backend/frontend.

Con esto, el proyecto queda listo para integrar un conector específico minimizando riesgo de incompatibilidades.
