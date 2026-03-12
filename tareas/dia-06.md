# Dia 6 — Auth parte 2: me + register + update profile + invitaciones

> Objetivo: completar el sistema de autenticacion con los endpoints restantes: obtener perfil (me), registro con invitacion, editar perfil, y generar tokens de invitacion. Reutilizamos todo lo del dia 5.

---

## Estudio (~1h)

### GET /auth/me — verificar el token

Este endpoint permite al frontend saber si el usuario tiene un token valido. Se usa cuando el usuario recarga la pagina — el frontend necesita saber si sigue logueado.

Flujo:
1. El navegador envia la cookie con el JWT automaticamente.
2. El middleware `isAuthenticated` verifica el token y pone `req.userId`.
3. Si el token es valido, buscamos el usuario en la DB y lo devolvemos.
4. Si no hay token o es invalido, el middleware devuelve 401 antes de llegar al controller.

```js
export async function me(req, res) {
  const user = await User.findById(req.userId);  // req.userId viene del middleware
  res.json(user);
}
```

Es una ruta protegida: necesita `isAuthenticated` delante.

### Registro con invitacion — por que y como

En nuestro proyecto no hay registro publico. Un admin existente genera un **token de invitacion** y se lo pasa al nuevo admin. El nuevo admin usa ese token para registrarse.

Flujo:
```
1. Admin logueado -> POST /api/admin/invitations -> recibe { token: "abc123" }
2. Admin copia el token y se lo da al nuevo admin
3. Nuevo admin -> POST /api/auth/register { name, email, password, token: "abc123" }
4. Servidor -> verifica que el token existe y no ha expirado
5. Servidor -> crea el usuario + borra el token
```

Para esto necesitamos un modelo Invitation que guarde los tokens.

### Modelo Invitation

Es un modelo auxiliar sencillo:

```js
const invitationSchema = new Schema({
  token: { type: String, required: true, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
```

El token puede ser un UUID generado con `crypto.randomUUID()` (incluido en Node, no necesita libreria).

Opcionalmente, puedes anadir una fecha de expiracion. Para el MVP no es necesario, pero si quieres:
```js
expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
```

### PATCH /auth/me — editar perfil

El admin puede editar su nombre y avatar. No puede cambiar su email ni su password desde este endpoint (por seguridad y simplicidad).

Como el modelo User tiene un pre-save hook para el password, usamos `Object.assign + save()` para que los hooks se ejecuten:

```js
const user = await User.findById(req.userId);  // req.userId viene del middleware
Object.assign(user, { name: req.body.name, avatar: req.body.avatar });
await user.save();
```

Pero como solo modificamos `name` y `avatar`, el hook `isModified("password")` devuelve false y no re-hashea nada.

### crypto.randomUUID()

Node incluye una funcion para generar UUIDs unicos sin instalar nada:

```js
import crypto from "crypto";

const token = crypto.randomUUID();
// "f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

Cada UUID es unico — la probabilidad de colision es insignificante.

---

## Tareas (~3.5h)

### Tarea 1 — Crear el modelo Invitation (~20min)

Crea `api/models/Invitation.model.js`:

```js
import { Schema, model } from "mongoose";

const invitationSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id;
      },
    },
  }
);

const Invitation = model("Invitation", invitationSchema);

export default Invitation;
```

### Tarea 2 — Completar el controller de auth (~45min)

Actualiza `api/controllers/auth.controller.js` con los nuevos endpoints:

```js
import crypto from "crypto";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import User from "../models/User.model.js";
import Invitation from "../models/Invitation.model.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createHttpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user || !(await user.checkPassword(password))) {
    throw createHttpError(401, "Invalid credentials");
  }

  const token = jwt.sign({ userId: user.id }, process.env.TOKEN_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.json(user);
}

export async function logout(req, res) {
  res.clearCookie("token");
  res.status(204).end();
}

export async function me(req, res) {
  // req.userId lo pone el middleware isAuthenticated tras verificar el JWT
  const user = await User.findById(req.userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  res.json(user);
}

export async function register(req, res) {
  const { name, email, password, token } = req.body;

  if (!token) {
    throw createHttpError(400, "Invitation token is required");
  }

  const invitation = await Invitation.findOne({ token });

  if (!invitation) {
    throw createHttpError(401, "Invalid or expired invitation token");
  }

  // Crear el usuario (el pre-save hook hashea el password)
  const user = await User.create({ name, email, password });

  // Borrar la invitacion (un solo uso)
  await Invitation.findByIdAndDelete(invitation.id);

  // Login automatico: firmar JWT y enviar cookie
  const jwtToken = jwt.sign({ userId: user.id }, process.env.TOKEN_SECRET, { expiresIn: "7d" });
  res.cookie("token", jwtToken, COOKIE_OPTIONS);

  res.status(201).json(user);
}

export async function updateProfile(req, res) {
  const user = await User.findById(req.userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  // Solo permitir cambiar name y avatar
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

  await user.save();

  res.json(user);
}

export async function createInvitation(req, res) {
  const token = crypto.randomUUID();

  const invitation = await Invitation.create({
    token,
    createdBy: req.userId,
  });

  res.status(201).json({ token: invitation.token });
}
```

### Tarea 3 — Actualizar las rutas (~20min)

Actualiza `api/config/routes.config.js`:

```js
import { Router } from "express";
import createHttpError from "http-errors";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
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

// Auth routes (publicas)
router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);

// Auth routes (protegidas)
router.post("/auth/logout", isAuthenticated, AuthController.logout);
router.get("/auth/me", isAuthenticated, AuthController.me);
router.patch("/auth/me", isAuthenticated, AuthController.updateProfile);

// Invitations (protegida — solo admins logueados)
router.post("/admin/invitations", isAuthenticated, AuthController.createInvitation);

// 404 catch-all
router.use((req, res, next) => {
  next(createHttpError(404, "Route not found"));
});

export default router;
```

Fijate:
- `register` y `login` son publicas (no necesitan `isAuthenticated`).
- `logout`, `me`, `updateProfile` y `createInvitation` son protegidas.

### Tarea 4 — Probar register con invitacion en Postman (~30min)

**Paso 1 — Login como admin:**
```
POST http://localhost:3000/api/auth/login
Body: { "email": "admin@retailcatalog.com", "password": "admin1234" }
```
Esperado: 200 + datos del admin.

**Paso 2 — Crear invitacion:**
```
POST http://localhost:3000/api/admin/invitations
(sin body, la cookie ya va sola)
```
Esperado: 201 + `{ "token": "f47ac10b-..." }`

Copia el token.

**Paso 3 — Registrar nuevo admin (en una ventana sin cookies o borrando cookies):**
```
POST http://localhost:3000/api/auth/register
Body:
{
  "name": "Segundo Admin",
  "email": "admin2@retailcatalog.com",
  "password": "password123",
  "token": "f47ac10b-..."  <-- pega aqui el token
}
```
Esperado: 201 + datos del nuevo usuario.

**Paso 4 — Intentar usar el mismo token otra vez:**
```
POST http://localhost:3000/api/auth/register
Body:
{
  "name": "Tercer Admin",
  "email": "admin3@test.com",
  "password": "password123",
  "token": "f47ac10b-..."  <-- mismo token
}
```
Esperado: 401 + `{ "message": "Invalid or expired invitation token" }` (el token ya se borro).

### Tarea 5 — Probar me y updateProfile en Postman (~20min)

**Probar me (logueado):**
```
GET http://localhost:3000/api/auth/me
```
Esperado: 200 + datos del usuario logueado.

**Probar me (sin cookie / despues de logout):**
Esperado: 401 + `{ "message": "Authentication required" }`

**Probar updateProfile:**
```
PATCH http://localhost:3000/api/auth/me
Body: { "name": "Admin Actualizado" }
```
Esperado: 200 + usuario con nombre actualizado.

**Probar que no se puede cambiar email ni password desde aqui:**
```
PATCH http://localhost:3000/api/auth/me
Body: { "email": "hacker@evil.com", "password": "newpassword" }
```
Esperado: 200 pero el email y password NO cambian (el controller solo permite name y avatar).

### Tarea 6 — Probar el flujo completo (~15min)

Haz el flujo completo de punta a punta:
1. Login como admin del seed.
2. Crear invitacion.
3. Logout.
4. Register con el token de invitacion.
5. Verificar con GET /api/auth/me que el nuevo admin esta logueado.
6. Logout.

---

## Refuerzo (~30min)

- Revisa en MongoDB Compass la coleccion `invitations` — deberia estar vacia si los tokens se borran tras usarse.
- Piensa en los edge cases: que pasa si alguien intenta registrarse sin token? Y con un token inventado? Y si el email ya existe? (El error E11000 del error handler se encarga de eso.)
- Compara el controller de auth con el flujo del PRD (seccion 4) y verifica que cubres todos los endpoints de auth.

---

## Checklist

- [ ] Modelo `Invitation.model.js` creado
- [ ] Controller `auth.controller.js` completo con: login, logout, me, register, updateProfile, createInvitation
- [ ] Rutas actualizadas en routes.config.js con isAuthenticated donde corresponde
- [ ] Login funciona y envia cookie con JWT
- [ ] Logout borra la cookie (204)
- [ ] GET /me devuelve el usuario logueado
- [ ] GET /me sin cookie (o cookie invalida) devuelve 401
- [ ] Crear invitacion devuelve un token unico
- [ ] Register con token valido crea usuario y borra la invitacion
- [ ] Register con token invalido devuelve 401
- [ ] Register con token ya usado devuelve 401
- [ ] Register con email duplicado devuelve 409 (error handler E11000)
- [ ] UpdateProfile solo cambia name y avatar, no email ni password
- [ ] Flujo completo probado de punta a punta
