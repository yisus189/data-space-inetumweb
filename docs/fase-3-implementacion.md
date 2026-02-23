# Fase 3 DSSC — implementación aplicada

Esta iteración implementa la base operativa de **Fase 3** para desacoplar control plane/data plane y habilitar integración con conector DSSC.

## 1) Adaptador de conector (control plane + data plane)

Se incorporó `backend/src/modules/connectors/dssc-connector.service.js` con capacidades:

- `syncContractToConnector(contract)` para sincronizar contratos activos al conector.
- `revokeContractInConnector(contract)` para revocación federada.
- `requestDataPlaneAccess(...)` para obtener endpoint/token de acceso mediado.
- `getConnectorStatus()` para health operacional.

### Modos

- `LOCAL_ENFORCEMENT` (default): ejecución local sin dependencia externa.
- `DSSC_HTTP`: integración real por HTTP al conector (`DSSC_CONNECTOR_BASE_URL`).

## 2) Integración de control plane

- En aprobación de solicitudes (`approveAccessRequest`) se sincroniza el contrato creado con el conector.
- En revocación de contratos (`revokeContract`) se propaga la revocación al conector.

> La sincronización está implementada en modo best-effort para no interrumpir operación interna si el conector externo falla.

## 3) Integración de data plane en exchange

Para datasets `EXTERNAL_API`:

- `prepareDatasetAccess` solicita acceso al adaptador de conector.
- Si el conector responde token/endpoint mediado, se devuelven en la respuesta.
- Se audita en `AccessLog.extra` el `connectorMode`, `connectorTransport` y metadatos de mediación.

## 4) Trust & identidad para interoperabilidad

### JWT reforzado para federación

- Se añadió soporte de firma configurable:
  - `HS256` (compatibilidad por defecto).
  - `RS256` (recomendado enterprise, con `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`).
- Se incluye `kid` en cabecera del token.

### Endpoints de metadatos

- `GET /auth/.well-known/jwks.json` expone JWKS cuando se usa `RS256`.
- `GET /auth/token-metadata` expone `issuer`, `audience`, `algorithm`, `kid`.
- `GET /connector/status` (solo `OPERATOR`) para validar estado del conector.

## 5) Variables de entorno clave

- `DATASPACE_CONNECTOR_MODE=LOCAL_ENFORCEMENT|DSSC_HTTP`
- `DSSC_CONNECTOR_BASE_URL=https://connector.example`
- `DSSC_CONNECTOR_API_KEY=...`
- `DSSC_CONNECTOR_MTLS_ENABLED=true|false`
- `JWT_ALGORITHM=HS256|RS256`
- `JWT_KID=inetum-key-2026-01`
- `JWT_PRIVATE_KEY=...` (si RS256)
- `JWT_PUBLIC_KEY=...` (si RS256)

## 6) Resultado de fase

Con esta entrega, el proyecto queda listo para operar en dos niveles:

1. **Modo local robusto** (sin dependencia externa).
2. **Modo federado DSSC_HTTP** con sincronización de contratos, mediación de acceso y endpoints de trust discovery.

Siguiente paso recomendado: conectar un proveedor DSSC concreto (Eclipse Dataspace Connector u otro) y mapear 1:1 payloads de negociación/producto del adaptador.
