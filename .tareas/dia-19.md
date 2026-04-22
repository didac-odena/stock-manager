# Dia 19 — Deploy completo (obligatorio)

> Objetivo: desplegar la aplicacion completa en produccion. Base de datos en MongoDB Atlas, API en Fly.io (Docker), frontend en Netlify. Al final del dia, la app debe ser accesible desde una URL publica.

---

## Estudio (~1h)

### Docker — conceptos clave

Docker empaqueta tu app en un **contenedor**: un entorno aislado con todo lo necesario para ejecutarla (Node, dependencias, codigo).

| Termino | Analogia | Descripcion |
|---|---|---|
| Imagen | Clase | Plantilla inmutable con todo el software necesario |
| Contenedor | Instancia (`new`) | Imagen en ejecucion, con su propio sistema de archivos y red |
| Dockerfile | Receta | Instrucciones para construir una imagen |

Dockerfile basico para nuestra API:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm install --omit=dev
COPY . .
CMD ["node", "server.js"]
```

Puntos clave:
- `--omit=dev` excluye devDependencies (nodemon, vitest...) → imagen mas ligera.
- El orden importa para la cache: primero `package*.json` + `npm install`, luego el resto del codigo. Asi Docker no reinstala dependencias si solo cambias codigo.
- Nunca pongas credenciales en el Dockerfile con `ENV`. Se quedarian grabadas en la imagen. Pasalas en runtime.

### .dockerignore

Igual que `.gitignore` pero para Docker. Evita copiar archivos innecesarios a la imagen:
```
node_modules
.env
.git
*.log
```

### Deploy — arquitectura separada

Desplegaremos API y Web por separado:

```
Usuario → Netlify  (React build, sitio estatico)
             ↕ peticiones HTTP
          Fly.io   (Express API, contenedor Docker)
             ↕
          MongoDB Atlas + Cloudinary
```

Cada servicio necesita conocer la URL del otro:
- **Fly.io** necesita `CORS_ORIGIN` = URL de Netlify (para permitir peticiones desde el frontend).
- **Netlify** necesita `VITE_API_URL` = URL de Fly.io + `/api` (para saber donde enviar las peticiones).

### Variables de entorno en Vite

Vite solo expone al navegador las variables que empiezan por `VITE_`. Las demas se quedan en el servidor de build y no llegan al cliente.

```js
// En los servicios de Axios
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});
```

Importante: las variables de Vite se inyectan en **build time**, no en runtime. Si cambias `VITE_API_URL` en Netlify, necesitas lanzar un nuevo deploy para que el cambio llegue al bundle.

### Archivo `_redirects` para Netlify

Las SPAs en Netlify necesitan un archivo `web/public/_redirects` con:
```
/* /index.html 200
```

Sin esto, al recargar una pagina como `/products/123`, Netlify devuelve 404 porque no encuentra ese archivo en disco. Con el `_redirects`, Netlify redirige todo a `index.html` y React Router toma el control.

### Variables de entorno en Vite — build time vs runtime

Las variables de entorno en Node.js (como las de Express) se leen en **runtime**: en el momento en que el servidor arranca, `process.env.PORT` tiene el valor que configuraste. Si lo cambias, basta con reiniciar el servidor.

Vite funciona de forma diferente: las variables se inyectan en **build time**, cuando ejecutas `npm run build`. El resultado es un bundle de JavaScript donde las variables ya estan sustituidas por sus valores literales. No hay `process.env` en el navegador.

```js
// En el codigo fuente (lo que escribes)
const baseURL = import.meta.env.VITE_API_URL;

// En el bundle final (lo que Vite genera)
const baseURL = "https://tu-app.fly.dev/api";  // ya sustituido
```

Consecuencia practica: si cambias `VITE_API_URL` en Netlify, necesitas lanzar un nuevo deploy para que el cambio surta efecto. El bundle anterior sigue teniendo la URL vieja.

Solo las variables que empiezan por `VITE_` se incluyen en el bundle. Las demas quedan en el servidor de build y no llegan al navegador (por seguridad).

### Cookies en produccion (HTTPS) — por que sameSite importa

Cuando API y Web estan en dominios distintos (cross-origin: Netlify + Fly.io), las cookies necesitan la opcion `sameSite: "none"`. Sin ella, el navegador bloquea el envio de la cookie en peticiones cross-origin.

```
En desarrollo (mismo origen via proxy):
  localhost:5173 → proxy Vite → localhost:3000
  El navegador cree que todo es el mismo origen → sameSite: "lax" funciona

En produccion (dominios distintos):
  tu-app.netlify.app → peticion HTTP → tu-api.fly.dev
  Son dominios distintos → sameSite debe ser "none" para que el navegador envie la cookie
```

La opcion `sameSite: "none"` SOLO funciona en combinacion con `secure: true` (la cookie debe ir por HTTPS). Por eso en produccion ambas opciones van juntas:

```js
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
```

En desarrollo: `secure: false` + `sameSite: "lax"` — funciona en localhost.
En produccion: `secure: true` + `sameSite: "none"` — necesario para cross-origin con HTTPS.

---

## Tareas (~4h)

### Tarea 1 — MongoDB Atlas (~30min)

1. Crea una cuenta en [mongodb.com/atlas](https://www.mongodb.com/atlas) (si no la tienes).
2. Crea un cluster gratuito (M0 Free Tier).
3. En **Database Access**, crea un usuario con password.
4. En **Network Access**, anade la IP `0.0.0.0/0` (permite conexion desde cualquier lugar — necesario para Fly.io).
5. En **Database > Connect**, copia la connection string. Documentala usando placeholders, no credenciales reales. Un ejemplo seguro seria:
   ```
   mongodb+srv://<DB_USER>:<DB_PASSWORD>@<ATLAS_CLUSTER_URL>/<DB_NAME>
   ```
6. Sustituye esos placeholders por tus valores reales solo en tu `.env` o en el panel de secretos del proveedor, nunca en archivos del repositorio.
7. Prueba la conexion desde tu terminal (opcional pero recomendado):
   ```bash
   cd api
   MONGODB_URI="tu-connection-string" node server.js
   ```
   Si conecta y muestra "Connected to DB", funciona.

### Tarea 2 — Preparar la API para produccion (~30min)

**2a. Crear `api/Dockerfile`:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm install --omit=dev
COPY . .
CMD ["node", "server.js"]
```

**2b. Crear `api/.dockerignore`:**

```
node_modules
.env
.git
*.log
```

**2c. Actualizar COOKIE_OPTIONS en `api/controllers/auth.controller.js`:**

Asegurate de que las opciones de la cookie funcionen tanto en desarrollo como en produccion. Anade `sameSite` para que la cookie funcione en dominios distintos (Netlify + Fly.io):

```js
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
```

- `secure: true` → la cookie solo se envia por HTTPS.
- `sameSite: "none"` → permite enviar la cookie a un dominio diferente (necesario porque Netlify y Fly.io son dominios distintos).

**2d. Verificar CORS en `api/app.js`:**

Asegurate de que CORS usa la variable de entorno:

```js
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
```

### Tarea 3 — Deploy API en Fly.io (~1h)

1. Crea una cuenta en [fly.io](https://fly.io) e instala la CLI:
   ```bash
   # Windows (PowerShell como administrador)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

   # O con npm
   npm install -g @flydotio/flyctl
   ```

2. Autenticate:
   ```bash
   fly auth login
   ```

3. Lanza el asistente desde la carpeta `api/`:
   ```bash
   cd api
   fly launch
   ```
   El asistente detecta el Dockerfile automaticamente. Elige un nombre para tu app y una region cercana (Madrid = `mad`).

4. Verifica que `fly.toml` tiene el puerto correcto:
   ```toml
   [http_service]
     internal_port = 3000
     force_https = true
   ```

5. Configura las variables de entorno secretas:
   ```bash
   fly secrets set MONGODB_URI="tu-connection-string-de-atlas"
   fly secrets set TOKEN_SECRET="una-clave-larga-y-aleatoria"
   fly secrets set CLOUDINARY_CLOUD_NAME="tu-cloud-name"
   fly secrets set CLOUDINARY_API_KEY="tu-api-key"
   fly secrets set CLOUDINARY_API_SECRET="tu-api-secret"
   fly secrets set CORS_ORIGIN="https://tu-app.netlify.app"
   ```
   (El CORS_ORIGIN lo actualizaras despues de crear el sitio en Netlify.)

6. Despliega:
   ```bash
   fly deploy
   ```

7. Verifica que funciona:
   ```bash
   fly status    # debe mostrar "running"
   fly logs      # revisa que no haya errores
   ```

8. Prueba el health check:
   ```bash
   curl https://tu-app.fly.dev/api/health
   ```

Comandos utiles de Fly.io:
```bash
fly status          # estado de la app
fly logs            # logs en tiempo real
fly secrets list    # ver que secrets hay configurados
fly apps restart    # reiniciar la app
```

### Tarea 4 — Preparar el frontend para produccion (~20min)

**4a. Crear `web/public/_redirects`:**

```
/* /index.html 200
```

**4b. Actualizar los servicios de Axios:**

En cada archivo de servicio (`web/src/services/auth.service.js`, `products.service.js`, `categories.service.js`), asegurate de que el `baseURL` use la variable de entorno:

```js
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});
```

**4c. Verificar que el build funciona:**

```bash
cd web
npm run build
```

Debe generar la carpeta `dist/` sin errores.

### Tarea 5 — Deploy Web en Netlify (~30min)

1. Sube tu repo a GitHub (si no lo has hecho):
   ```bash
   git add .
   git commit -m "feat: prepare for deployment"
   git push origin main
   ```

2. Ve a [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import an existing project".

3. Conecta tu repositorio de GitHub.

4. Configura el build:

   | Campo | Valor |
   |---|---|
   | Base directory | `web` |
   | Build command | `npm run build` |
   | Publish directory | `web/dist` |

5. En **Site configuration > Environment variables**, anade:
   ```
   VITE_API_URL = https://tu-app.fly.dev/api
   ```

6. Haz clic en Deploy.

7. Una vez desplegado, copia la URL de Netlify (ej: `https://tu-app.netlify.app`).

### Tarea 6 — Conectar los dos servicios (~20min)

Ahora que tienes las dos URLs, necesitas que cada servicio conozca al otro:

1. **Actualizar CORS_ORIGIN en Fly.io** con la URL real de Netlify:
   ```bash
   fly secrets set CORS_ORIGIN="https://tu-app.netlify.app"
   ```
   (Sin barra final `/` al final de la URL.)

2. **Verificar VITE_API_URL en Netlify** — debe apuntar a la URL de Fly.io:
   ```
   https://tu-app.fly.dev/api
   ```
   Si la cambiaste, necesitas hacer un re-deploy en Netlify (las variables de Vite se inyectan en build time).

3. **Crear el primer admin en produccion:**
   ```bash
   fly ssh console
   # Dentro del contenedor:
   node data/seed.js
   ```

### Tarea 7 — Verificar todo en produccion (~30min)

Abre la URL de Netlify en el navegador y prueba el flujo completo:

**Visitante:**
1. Home → se ven categorias y productos destacados.
2. Catalogo → filtros y busqueda funcionan.
3. Detalle → galeria de imagenes funciona.

**Admin:**
1. Login con las credenciales del seed → entra al panel admin.
2. Crear producto con imagenes → aparece en la tabla.
4. Editar producto → campos pre-rellenados, guardar funciona.
4. Eliminar producto → desaparece.
5. Perfil → editar nombre funciona.
6. Logout → vuelve a la web publica.
7. Los productos creados aparecen en el catalogo publico.

**Problemas comunes:**
- "Network Error" en login → revisa CORS_ORIGIN y que `credentials: true` esta en ambos lados (Express y Axios).
- Cookie no se envia → revisa `secure: true` y `sameSite: "none"` en COOKIE_OPTIONS del auth controller.
- 404 al recargar → falta el archivo `_redirects` en `web/public/`.
- Imagenes no suben → revisa las variables de Cloudinary en Fly.io secrets.

---

## Refuerzo (~30min)

- Envia la URL de Netlify a un companero o abrela desde el movil para verificar que funciona desde otro dispositivo.
- Revisa los logs de Fly.io (`fly logs`) para asegurarte de que no hay errores.
- Si algo falla, revisa la seccion de "Problemas comunes" arriba.
- Haz una captura de pantalla de la app funcionando en produccion — la necesitaras para la presentacion.

---

## Checklist

- [ ] MongoDB Atlas configurado (cluster M0 + usuario + IP 0.0.0.0/0)
- [ ] Connection string probada
- [ ] Dockerfile creado para la API
- [ ] .dockerignore creado
- [ ] Cookie configurada para produccion (secure + sameSite)
- [ ] CORS usa variable de entorno
- [ ] API desplegada en Fly.io (fly deploy)
- [ ] Health check responde en la URL de Fly.io
- [ ] Variables secretas configuradas en Fly.io (MONGODB_URI, TOKEN_SECRET, Cloudinary, CORS_ORIGIN)
- [ ] _redirects creado en web/public/
- [ ] Servicios Axios usan VITE_API_URL
- [ ] Build del frontend funciona sin errores
- [ ] Web desplegada en Netlify
- [ ] VITE_API_URL configurada en Netlify
- [ ] CORS_ORIGIN en Fly.io apunta a la URL de Netlify
- [ ] Admin seed ejecutado en produccion
- [ ] Login funciona en produccion
- [ ] Crear/editar/eliminar productos funciona en produccion
- [ ] Catalogo publico muestra productos en produccion
- [ ] Imagenes se suben correctamente via Cloudinary
