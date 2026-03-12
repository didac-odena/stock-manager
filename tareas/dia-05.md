# Dia 5 — Auth parte 1: JWT en cookies + login + logout

> Objetivo: entender la autenticacion basada en JWT con cookies httpOnly, crear el middleware de auth y los endpoints de login y logout. Es el dia mas conceptual del backend — tomate tu tiempo con la teoria.

---

## Estudio (~1.5h)

### Autenticacion: que es y por que la necesitamos

Autenticacion = verificar que alguien es quien dice ser. En nuestra app, los admins necesitan demostrar su identidad para gestionar productos.

### JWT — que es un JSON Web Token

Un JWT es un string en tres partes separadas por puntos:

```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2NzAifQ.8vK2QrZ7Yw
    HEADER                    PAYLOAD            SIGNATURE
```

- **Header**: algoritmo usado para firmar.
- **Payload**: datos que queremos guardar (ej: `{ userId: "670" }`). Son legibles por cualquiera — no guardes passwords aqui.
- **Signature**: firma digital. Generada con el `TOKEN_SECRET`. Si alguien modifica el payload, la firma no coincide y el token es invalido.

JWT no es encriptacion — es **firma**. El payload se puede leer sin el secreto. La firma solo garantiza que no ha sido modificado.

```js
import jwt from "jsonwebtoken";

// Firmar (al hacer login)
const token = jwt.sign({ userId: user.id }, process.env.TOKEN_SECRET, { expiresIn: "7d" });

// Verificar (en el middleware de auth)
const payload = jwt.verify(token, process.env.TOKEN_SECRET);
// Si el token es invalido o ha expirado, jwt.verify lanza un error
// Si es valido, devuelve el payload: { userId: "670", iat: ..., exp: ... }
```

### Cookies httpOnly — donde guardar el token

Podriamos guardar el JWT en `localStorage`, como se hace en clase. Pero hay una opcion mas segura: guardarlo en una **cookie httpOnly**.

| | localStorage | Cookie httpOnly |
|---|---|---|
| Accesible desde JS | Si | No |
| Vulnerable a XSS | Si | No |
| Se envia automaticamente | No (manual en header) | Si |
| Requiere cookie-parser | No | Si |

`httpOnly: true` significa que el JavaScript de la pagina NO puede leer la cookie. Esto protege el token si hay un ataque XSS.

### Flujo completo de auth en nuestro proyecto

```
LOGIN:
  Cliente  -> POST /api/auth/login { email, password }
  Servidor -> verifica credenciales
           -> jwt.sign({ userId }) con TOKEN_SECRET
           -> res.cookie("token", jwt, { httpOnly: true, ... })
           -> responde con datos del usuario

RUTA PROTEGIDA:
  Cliente  -> GET /api/auth/me (el navegador envia la cookie automaticamente)
  Servidor -> isAuthenticated lee req.cookies.token
           -> jwt.verify(token, TOKEN_SECRET)
           -> si valido: req.userId = payload.userId, next()
           -> si invalido: 401

LOGOUT:
  Cliente  -> POST /api/auth/logout
  Servidor -> res.clearCookie("token")
           -> 204
```

### cookie-parser — leer cookies en Express

`cookie-parser` (instalado el dia 1, registrado en app.js) parsea el header `Cookie` de la request y lo pone disponible en `req.cookies`:

```js
// Sin cookie-parser: req.cookies es undefined
// Con cookie-parser:
const token = req.cookies.token;  // el JWT que enviamos en el login
```

### res.cookie() y res.clearCookie()

```js
// Enviar la cookie al navegador (en login)
res.cookie("token", jwtString, {
  httpOnly: true,                              // no accesible desde JS
  secure: process.env.NODE_ENV === "production", // solo HTTPS en produccion
  maxAge: 7 * 24 * 60 * 60 * 1000,            // 7 dias en milisegundos
});

// Borrar la cookie (en logout)
res.clearCookie("token");
```

### CORS y cookies — withCredentials

Para que el navegador envie la cookie en peticiones cross-origin (frontend en :5173, backend en :3000):

1. Backend: `cors({ credentials: true, origin: "http://localhost:5173" })` — ya configurado en dia 1.
2. Frontend (mas adelante): Axios con `withCredentials: true`.

---

## Tareas (~3h)

### Tarea 1 — Crear el middleware isAuthenticated (~20min)

Crea `api/middlewares/auth.middleware.js`:

```js
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";

export function isAuthenticated(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    throw createHttpError(401, "Authentication required");
  }

  try {
    const payload = jwt.verify(token, process.env.TOKEN_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    throw createHttpError(401, "Invalid or expired token");
  }
}
```

Puntos clave:
- Lee el token de `req.cookies.token` (no del header Authorization).
- `jwt.verify` lanza un error si el token es invalido o ha expirado — lo capturamos con try/catch y devolvemos 401.
- Si el token es valido, guardamos el `userId` en `req.userId` para que los controllers lo puedan usar.
- El try/catch es necesario aqui porque `jwt.verify` puede lanzar errores sincronos que Express 5 no captura automaticamente dentro de middlewares no-async.

### Tarea 2 — Crear el controller de auth con login y logout (~45min)

Crea `api/controllers/auth.controller.js`:

```js
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import User from "../models/User.model.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 dias
};

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createHttpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  // Mismo mensaje si email no existe o password incorrecta
  // — no revelar que emails estan registrados
  if (!user || !(await user.checkPassword(password))) {
    throw createHttpError(401, "Invalid credentials");
  }

  // Firmar el JWT con el ID del usuario
  const token = jwt.sign({ userId: user.id }, process.env.TOKEN_SECRET, {
    expiresIn: "7d",
  });

  // Enviar el token como cookie httpOnly
  res.cookie("token", token, COOKIE_OPTIONS);

  res.json(user);
}

export async function logout(req, res) {
  res.clearCookie("token");
  res.status(204).end();
}
```

Puntos clave:
- `jwt.sign({ userId: user.id }, TOKEN_SECRET, { expiresIn: "7d" })` — firmamos el token con el ID del usuario y lo hacemos expirar en 7 dias.
- `res.cookie("token", token, COOKIE_OPTIONS)` — enviamos el token como cookie httpOnly al navegador.
- `user.id` (sin guion bajo) — el virtual `id` de Mongoose, que es el `_id` en formato string. Mas comodo que `user._id.toString()`.
- Logout simplemente borra la cookie — el servidor no guarda estado.

### Tarea 3 — Anadir rutas de auth al router (~20min)

Actualiza `api/config/routes.config.js`:

```js
import { Router } from "express";
import createHttpError from "http-errors";
import { CATEGORIES } from "./categories.config.js";
import * as AuthController from "../controllers/auth.controller.js";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Categorias (publica)
router.get("/categories", (req, res) => {
  res.json(CATEGORIES);
});

// Auth routes
router.post("/auth/login", AuthController.login);
router.post("/auth/logout", AuthController.logout);

// 404 catch-all (siempre al final)
router.use((req, res, next) => {
  next(createHttpError(404, "Route not found"));
});

export default router;
```

### Tarea 4 — Probar login con Postman (~30min)

1. Asegurate de que el seed esta ejecutado (el admin existe en la DB).
2. Arranca el servidor: `npm run dev`

**Probar login correcto:**
```
POST http://localhost:3000/api/auth/login
Body (JSON):
{
  "email": "admin@retailcatalog.com",
  "password": "admin1234"
}
```
- Esperado: 200 + datos del usuario (name, email, avatar, id — sin password)
- En Postman, ve a "Cookies" — deberia aparecer una cookie llamada `token`

**Probar login con password incorrecta:**
```
POST http://localhost:3000/api/auth/login
Body (JSON):
{
  "email": "admin@retailcatalog.com",
  "password": "wrongpassword"
}
```
- Esperado: 401 + `{ "message": "Invalid credentials" }`

**Probar login con email inexistente:**
```
POST http://localhost:3000/api/auth/login
Body (JSON):
{
  "email": "noexiste@test.com",
  "password": "whatever"
}
```
- Esperado: 401 + `{ "message": "Invalid credentials" }` (mismo mensaje — no revelamos si el email existe)

**Probar logout:**
```
POST http://localhost:3000/api/auth/logout
```
- Esperado: 204 (sin body), la cookie `token` desaparece

### Tarea 5 — Verificar que el middleware funciona (~15min)

El middleware `isAuthenticated` aun no esta en ninguna ruta, pero puedes probarlo manualmente. Anade una ruta temporal de prueba en `routes.config.js`:

```js
import { isAuthenticated } from "../middlewares/auth.middleware.js";

// Ruta de prueba — borra esta linea cuando termines de probar
router.get("/test-auth", isAuthenticated, (req, res) => {
  res.json({ ok: true, userId: req.userId });
});
```

Prueba en Postman:
- Sin haber hecho login: `GET /api/test-auth` → 401
- Despues de hacer login (la cookie se guarda en Postman): `GET /api/test-auth` → 200 + `{ ok: true, userId: "..." }`
- Despues de logout: `GET /api/test-auth` → 401

Cuando hayas verificado que funciona, **borra la ruta de prueba**.

---

## Refuerzo (~30min)

- Revisa el flujo completo: login firma el JWT → lo guarda en cookie → el middleware lo lee y verifica → logout lo borra.
- Preguntate: si alguien modifica el payload del JWT (cambia su userId por el de otro admin), el middleware lo detecta? (Si, porque la firma ya no coincide con el TOKEN_SECRET.)
- Compara con lo que se hizo en clase con Iron Projects: ahi se guardaba un ObjectId de sesion en la cookie y se buscaba en la DB. Aqui el JWT ya contiene el userId — no necesitamos buscar en la DB hasta que necesitamos los datos completos del usuario.

---

## Checklist

- [ ] `auth.middleware.js` creado con `isAuthenticated`
- [ ] Middleware lee el token de `req.cookies.token` (no del header)
- [ ] Middleware hace `jwt.verify` y en caso de error devuelve 401
- [ ] Middleware guarda `req.userId` si el token es valido
- [ ] `auth.controller.js` con `login` y `logout`
- [ ] Login hace `jwt.sign` con `{ userId }` y TOKEN_SECRET
- [ ] Login usa `res.cookie("token", token, { httpOnly: true, ... })`
- [ ] Logout usa `res.clearCookie("token")`
- [ ] Rutas `/api/auth/login` y `/api/auth/logout` en routes.config.js
- [ ] Login correcto devuelve 200 + datos del usuario (sin password)
- [ ] Login incorrecto devuelve 401 (mismo mensaje para email y password)
- [ ] Logout devuelve 204
- [ ] Cookie `token` aparece en Postman tras login
- [ ] Cookie desaparece tras logout
- [ ] Ruta de prueba borrada
