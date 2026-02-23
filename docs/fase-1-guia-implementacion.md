# Fase 1 DSSC (Hardening) — Guía paso a paso

Esta guía aterriza la **Fase 1** para dejar el backend listo como base sólida antes de integrar conectores DSSC.

## Objetivo de la fase

Garantizar que el acceso al dato esté protegido por:

1. Contrato vigente y utilizable.
2. Estado operativo del dataset.
3. Endpoints de contrato estables.
4. Una primera versión de `self-description` para interoperabilidad.

---

## Paso 1 — Unificar acceso a Prisma

### Qué se implementó

- Se eliminó el uso local de `new PrismaClient()` en contratos.
- Se usa `backend/src/config/db.js` como cliente único.

### Por qué

Evita conexiones duplicadas, reduce inconsistencias y simplifica operación.

---

## Paso 2 — Corregir endpoint de contratos

### Qué se implementó

- Corrección de la consulta `GET /contracts/:id` para evitar mezcla inválida de `include` y `select`.
- Añadida verificación básica de permisos (`provider`, `consumer` u `operator`).
- Se exponen endpoints ODRL:
  - `GET /contracts/:id/odrl-policy`
  - `PUT /contracts/:id/odrl-policy`

### Por qué

Previene errores en tiempo de ejecución y fortalece seguridad por rol.

---

## Paso 3 — Validar vigencia contractual antes del acceso

### Qué se implementó

- Nuevo servicio de validación contractual:
  - `backend/src/modules/contracts/contract-validation.service.js`
- Reglas aplicadas:
  - contrato existente,
  - `status === ACTIVE`,
  - `effectiveFrom <= now`,
  - `effectiveTo` no vencido.

### Por qué

Evita accesos con contratos revocados, futuros o expirados.

---

## Paso 4 — Endurecer `exchange` y validación de datasets

### Qué se implementó

- `exchange.service` ahora exige contrato utilizable (paso 3).
- Se bloquea acceso si dataset:
  - no está `ACTIVE`,
  - está `blocked`,
  - o no está `published`.
- En solicitudes de acceso (`accessRequest`), se rechaza dataset bloqueado/no activo.

### Por qué

Se alinea el acceso técnico con estado operativo del catálogo.

---

## Paso 5 — Implementar self-description inicial

### Qué se implementó

Nuevo módulo:

- `backend/src/modules/selfDescription/selfDescription.service.js`
- `backend/src/modules/selfDescription/selfDescription.controller.js`
- `backend/src/modules/selfDescription/selfDescription.routes.js`

Endpoint:

- `GET /self-description`

Incluye secciones inspiradas en tu diagrama:

- autoridad de gobierno,
- data space,
- etiquetas,
- proveedores,
- consumidores,
- recursos,
- políticas ODRL,
- contratos,
- productos,
- métricas de calidad.

### Por qué

Es la pieza base para exponer identidad/capacidades del data space hacia integraciones DSSC.

---

## Paso 6 — Orden correcto del middleware de errores

### Qué se implementó

- Se movió `errorHandler` al final real de rutas en `app.js`.

### Por qué

Garantiza manejo centralizado de errores en todos los módulos.

---

## Paso 7 — Validación operativa de la fase

Ejecutar:

```bash
cd backend && node -e "require('./src/app'); console.log('backend app load ok')"
cd backend && npx prisma validate
cd frontend && npm run build
```

---

## Próximo paso recomendado (Fase 2)

Añadir enforcement ODRL en tiempo real en `exchange` (permit/deny explícito por acción, propósito y vigencia), con trazabilidad de decisión en `AccessLog.extra`.
