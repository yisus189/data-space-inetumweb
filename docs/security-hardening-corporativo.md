# Hardening de seguridad corporativa del Data Space

Este documento resume las mejoras implementadas para elevar el backend hacia un perfil de seguridad corporativo.

## Controles implementados

## 1) Protección de superficie HTTP

- Deshabilitado `X-Powered-By`.
- Cabeceras de seguridad globales:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: no-referrer`
  - `Permissions-Policy` restrictiva
  - `Content-Security-Policy` orientada a API
  - `Strict-Transport-Security` cuando la petición llega por HTTPS

## 2) Control de abuso y DoS básico

- Rate limit global por IP.
- Rate limit reforzado para `/auth` (login/register).
- Respuesta con `429` y `Retry-After`.

## 3) Endurecimiento de entrada

- Límite de payload JSON/urlencoded a `256kb`.
- Sanitización de `body/query/params` contra claves peligrosas (`__proto__`, `constructor`, `prototype`) para mitigar prototype pollution.

## 4) CORS corporativo

- CORS limitado a orígenes explícitos via `CORS_ALLOWED_ORIGINS`.
- Bloqueo por defecto de orígenes no permitidos.

## 5) JWT robusto

- Emisión con `HS256`, `issuer` y `audience`.
- Verificación estricta de `algorithm`, `issuer` y `audience`.
- Token por query param deshabilitado por defecto (`ALLOW_QUERY_TOKEN=false`).
- Compatibilidad opcional solo si se habilita explícitamente por entorno.

## 6) Credenciales y autenticación

- Validación fuerte de contraseña en registro:
  - mínimo 12 caracteres,
  - mayúsculas,
  - minúsculas,
  - número,
  - símbolo.
- Normalización de email y validación de formato.
- Eliminación de logs de depuración sensibles en login.
- Hash de contraseña de registro aumentado (`bcrypt` salt rounds 12).

## 7) Frontend y token handling

- Se elimina el envío de token en query string para descarga.
- Descarga de archivos usando `Authorization: Bearer`.
- Apertura de URL externa con `noopener,noreferrer`.

## Variables de entorno recomendadas

- `JWT_SECRET`: secreto largo y rotado periódicamente.
- `JWT_ISSUER`: p.ej. `inetum-dataspace`.
- `JWT_AUDIENCE`: p.ej. `inetum-dataspace-api`.
- `CORS_ALLOWED_ORIGINS`: lista de frontends autorizados.
- `ALLOW_QUERY_TOKEN=false` en producción.

## Próximos pasos (nivel enterprise)

- mTLS entre componentes críticos.
- gestión de secretos centralizada (Vault/KMS).
- rotación automática de claves JWT (kid + JWKS interno).
- auditoría inmutable y SIEM.
- SAST/DAST y escaneo de dependencias en CI.
