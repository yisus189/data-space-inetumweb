# Seguridad inmediata: rotación de credenciales y saneamiento de historial

Este procedimiento aplica tras detectar exposición de secretos en repositorio.

## 1) Rotar credenciales **de inmediato**

1. **Base de datos**
   - Cambiar contraseña del usuario de DB.
   - Revocar sesiones activas si aplica.
   - Actualizar `DATABASE_URL` en todos los entornos.

2. **JWT**
   - Regenerar secreto (`JWT_SECRET`) si se usa HS256.
   - Si se usa RS256, regenerar par de claves y actualizar `JWT_KID`.
   - Mantener clave previa temporalmente en `JWT_PUBLIC_KEYS_JSON` para rotación sin downtime.

3. **Conector DSSC**
   - Rotar `DSSC_CONNECTOR_API_KEY`.
   - Rotar certificados mTLS (`DSSC_CONNECTOR_MTLS_CERT_PATH`, `DSSC_CONNECTOR_MTLS_KEY_PATH`).

## 2) Eliminar secretos del versionado

- Se ignorarán archivos `.env` mediante `.gitignore`.
- Eliminar del índice cualquier secreto trackeado:

```bash
git rm --cached backend/.env
```

## 3) Limpiar historial Git (si hubo secretos comprometidos)

> Requiere coordinación con todo el equipo (reescritura de historial + force push).

### Opción recomendada: `git filter-repo`

```bash
pip install git-filter-repo

git filter-repo --path backend/.env --invert-paths
```

Si hubo más secretos en otros archivos, añadir rutas/expresiones según inventario.

Después:

```bash
git push --force --all
git push --force --tags
```

## 4) Post-remediación

- Invalidar tokens JWT emitidos antes de la rotación.
- Verificar que `GET /auth/token-metadata` refleje nueva configuración trust.
- Confirmar que no quedan secretos en historial ni en PRs previos.
- Activar secret scanning en GitHub (push protection).

## 5) Checklist rápido

- [ ] Password DB rotada
- [ ] JWT secret/keys rotados
- [ ] API key/certificados de conector rotados
- [ ] `.env` fuera del índice Git
- [ ] Historial saneado
- [ ] Secret scanning habilitado
