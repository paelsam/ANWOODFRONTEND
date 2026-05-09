# ANGWOOD Frontend v2

Proyecto base con la misma estructura que `angwood-frontend`, enfocado en implementar historias de usuario de forma incremental.

## Alcance actual

- **Header con autenticación**: navbar con acceso a inicio de sesión / registro y cierre de sesión.
- Backend: carpeta `ANWOODBACKEND` (FastAPI). Rutas de auth: `POST /token` (OAuth2 form), `POST /users` (registro).

Configura `VITE_API_URL` en `.env` (por defecto `http://localhost:8000`). El servidor de Vite usa el puerto **3000** (CORS del backend debe permitir `http://localhost:3000`).

## Pendiente (no incluido aún)

Catálogo, carrito, cotizaciones, admin y sus servicios (`cart`, `inventory`, `quotations`, etc.) se añadirán en historias posteriores.

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Opcional: usar Bun

Si prefieres `bun` como gestor de paquetes y ejecutor, instala Bun siguiendo https://bun.sh y luego ejecuta:

```bash
bun install
bun run dev
bun run build
```

`bun` suele ser compatible con Vite y la mayoría de dependencias; si encuentras problemas, vuelve a usar `npm install`.
