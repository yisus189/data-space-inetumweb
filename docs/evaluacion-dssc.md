# Evaluación técnica del proyecto para compatibilidad DSSC

## Resumen ejecutivo

Estado actual del proyecto frente a un **Data Space corporativo con conectores y reglas DSSC**:

- **Madurez funcional actual**: media para gestión interna de catálogo, solicitudes y contratos.
- **Madurez de interoperabilidad DSSC**: baja.
- **Riesgo principal**: el sistema actualmente gestiona contratos y accesos de forma local, pero **no implementa un conector DSSC real** (control plane/data plane), ni la validación/ejecución automática de políticas ODRL durante el acceso.

> Conclusión: la base de producto está bien para un piloto interno, pero para operar como participante DSSC se requiere una capa de integración específica de conectores, políticas y trust.

---

## Qué está bien implementado hoy

### 1) Modelo de dominio útil para un Data Space interno

El esquema de datos ya contempla:

- Usuarios con roles (PROVIDER, CONSUMER, OPERATOR).
- Catálogo de datasets internos/externos.
- Solicitudes de acceso, negociación y contratos.
- Registro de accesos (auditabilidad).
- Política ODRL almacenada por contrato (JSON).

Esto da una base sólida para alinear con DSSC, especialmente por la presencia de `Contract.odrlPolicy` y `AccessLog`.

### 2) Flujo de acceso con precondición contractual

La lógica de `exchange` exige contrato activo antes de permitir descarga o acceso a API externa. Esto está bien como control mínimo de autorización de uso.

### 3) Frontend con edición de ODRL

Existe un editor de política ODRL en frontend que permite persistir política por contrato. Es una capacidad útil para madurar compliance.

---

## Brechas críticas para DSSC (prioridad alta)

## A) No hay conectores DSSC reales

No se observan componentes equivalentes a:

- Connector/Control Plane (negociación machine-to-machine).
- Data Plane (transferencia gobernada por contrato/política).
- Gestión de credenciales de confianza entre participantes.

Actualmente el acceso a datos se hace por descarga local o proxy HTTP simple. Eso no cumple por sí solo los patrones típicos de DSSC para interoperabilidad federada.

## B) ODRL se guarda, pero no se ejecuta en tiempo de acceso

La política ODRL se persiste en contrato, pero el flujo de `exchange` no valida restricciones ODRL antes de entregar datos (ejemplo: propósito, temporalidad, acciones permitidas, prohibiciones).

Esto deja una brecha entre “política declarada” y “política aplicada”.

## C) Integración de catálogos externos en modo placeholder

La sincronización de metadatos externos está marcada como hook/placeholder (“falso”).

Para un despliegue DSSC real, esta parte debe conectarse a fuentes reales con trazabilidad, normalización semántica y validaciones.

## D) Seguridad y cumplimiento aún básicos para entorno federado

Aunque hay JWT y control por roles, faltan piezas clave para federación enterprise:

- Trust framework (identidad verificable entre participantes).
- Endurecimiento de canal (mTLS/firmas/token exchange según estándar objetivo).
- Política de secretos/certificados y rotación.
- Evidencias de cumplimiento automatizadas.

---

## Hallazgos técnicos puntuales que conviene corregir

1. En rutas de contratos hay una consulta Prisma con mezcla no válida de `include` y `select` dentro del mismo objeto anidado (potencial error en ejecución en `GET /contracts/:id`).
2. Hay dos estilos de acceso a Prisma coexistiendo (`config/db` y `new PrismaClient()` en controladores/rutas), lo que dificulta consistencia operativa.
3. No se ven tests automáticos (unitarios/integración) para los flujos críticos de acceso por contrato + auditoría.

---

## Plan recomendado para “funcionar con conectores y reglas DSSC”

## Fase 1 (2–4 semanas): Hardening de base

- Corregir consultas Prisma inconsistentes.
- Unificar patrón de acceso a DB.
- Añadir validaciones obligatorias de contrato/estado/fechas antes de acceso.
- Implementar tests API para:
  - Sin contrato -> 403.
  - Contrato revocado/expirado -> bloqueo.
  - Registro audit en cada acceso.

## Fase 2 (3–6 semanas): Policy enforcement real (ODRL)

- Definir perfil ODRL mínimo soportado (acciones, restricciones, prohibiciones).
- Implementar motor de evaluación de políticas en backend (`policy enforcement point`) antes de descarga/proxy.
- Rechazar acceso con motivo explícito cuando política no se cumpla.
- Registrar en auditoría el resultado de evaluación de política.

## Fase 3 (4–8 semanas): Integración de conectores DSSC

- Introducir un adaptador de conector (inicialmente 1 proveedor tecnológico de referencia).
- Desacoplar `exchange` en:
  - Control plane adapter (negociación/contract artifacts).
  - Data plane adapter (transferencia gobernada).
- Mapear `Contract` y `AccessRequest` locales al modelo de negociación del conector.

## Fase 4 (continuo): Trust & Compliance

- Identidad federada de participantes y validación de credenciales.
- Gestión de certificados/secretos.
- Trazas firmadas y evidencias para auditoría DSSC.
- Pruebas E2E entre dos participantes simulados (provider/consumer) con conector real.

---

## Checklist de aceptación mínima DSSC-ready

- [ ] El acceso a datos se concede solo si contrato + política ODRL evalúan en `ALLOW`.
- [ ] Existe al menos un conector DSSC integrado en flujo real (no mock).
- [ ] Hay prueba E2E de negociación + transferencia con auditoría verificable.
- [ ] Los metadatos de catálogo externos se sincronizan desde fuente real con manejo de errores.
- [ ] Se documenta modelo de trust y credenciales entre participantes.

---

## Veredicto

El proyecto tiene una **base funcional correcta para un data space interno**, pero **todavía no está listo como implementación DSSC interoperable**.

La prioridad debe ser pasar de:

- “gestión local de contratos y accesos”,

hacia:

- “ejecución de políticas + conectores DSSC + trust federado”.

Si quieres, en el siguiente paso te puedo entregar un **plan técnico de implementación por épicas y tareas Jira** (con estimación, dependencias y definición de done) para ejecutar estas 4 fases.
