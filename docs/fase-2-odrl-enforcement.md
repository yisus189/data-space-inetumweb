# Fase 2 DSSC — Enforzamiento ODRL (implementación inicial)

Se implementó un primer `Policy Enforcement Point` en el flujo de intercambio de datasets.

## Qué se agregó

- Servicio de evaluación ODRL: `backend/src/modules/exchange/odrl-policy.service.js`.
- Integración de evaluación en `prepareDatasetAccess` antes de entrega de datos.
- Contexto de evaluación por request:
  - `action` (query param opcional)
  - `purpose` (query param opcional)
- Si la política deniega, se responde 403 con motivo.
- En accesos permitidos, se anota `policyDecision: ALLOW` en auditoría (`AccessLog.extra`).

## Perfil ODRL MVP soportado

- `permission`
  - `action` string u objeto
  - `constraint` para:
    - `purpose`
    - `dateTime` con `gteq/gt/after/lteq/lt/before`
- `prohibition`
  - misma semántica de acciones y restricciones

## Comportamiento

1. Sin política ODRL -> allow por defecto.
2. Con política:
   - Debe haber al menos una `permission` que matchee acción + restricciones.
   - Si existe una `prohibition` que matchee, prevalece denegación.

## Pruebas unitarias añadidas

- `backend/tests/odrl-policy.service.test.js`
- `backend/tests/contract-validation.service.test.js`

## Siguiente mejora recomendada

- Registrar intentos `DENY` en auditoría con un nuevo `AccessAction` específico (requiere migración prisma).
