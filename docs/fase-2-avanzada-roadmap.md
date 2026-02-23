# Fase 2 avanzada — seguridad y enforcement DSSC

## Mejoras implementadas en esta iteración

1. **Auditoría explícita de denegaciones ODRL**
   - Nuevo `AccessAction.POLICY_DENY` en Prisma.
   - En `exchange`, cuando una política deniega se registra `AccessLog` con:
     - `policyDecision: DENY`
     - `reason`
     - `matchedRuleType`
     - `action`, `assignee`, `assigner`, `target`.

2. **Evaluator ODRL ampliado (MVP+)**
   - Restricciones soportadas:
     - `purpose`
     - `dateTime`
     - `assignee`
     - `assigner`
     - `target`
   - Operadores soportados:
     - `eq`
     - `neq`
     - `isAnyOf`
     - `gteq|gt|after`
     - `lteq|lt|before`
   - Devuelve metadato `matchedRuleType` para trazabilidad.

3. **Contexto ODRL enriquecido**
   - `prepareDatasetAccess` construye contexto con URNs:
     - `assignee: urn:dataspace:user:{id}`
     - `assigner: urn:dataspace:user:{providerId}`
     - `target: urn:dataspace:dataset:{id}`

4. **Self-description mejorada para interoperabilidad**
   - Se añaden:
     - `version`
     - `issuedAt`
     - `profile`
     - bloque `capabilities`
     - bloque `security`

5. **Pruebas ampliadas**
   - Nuevos casos unitarios del evaluator para:
     - `assignee/target`
     - `neq`
     - `isAnyOf`.

---

## Siguiente bloque recomendado (Fase 3)

- Adaptador de conector DSSC real (control plane/data plane).
- Trust federado (mTLS, validación de credenciales entre participantes).
- Rotación de claves JWT con `kid` y endpoint JWKS interno.
- Auditoría inmutable + export a SIEM.
