# Dia 1 — Setup del proyecto backend

> Objetivo: tener el servidor Express arrancado, conectado a MongoDB, con la estructura de carpetas del proyecto y un endpoint de health check funcionando.

---

## Estudio (~1h)

### Que es Express y para que sirve

Express es un framework para Node.js que facilita crear servidores HTTP. Sin Express tendrias que manejar las peticiones HTTP a mano (parsear headers, body, rutas...). Express hace todo eso por ti.

El flujo basico es:
1. Un cliente (navegador, Postman) envia una peticion HTTP (GET, POST, etc.).
2. Express la recibe y la pasa por middlewares (funciones intermedias).
3. La peticion llega a un handler (funcion que responde).
4. El handler envia una respuesta JSON.

### Estructura MVC adaptada a nuestro proyecto

MVC separa responsabilidades para que no tengas todo en un solo archivo:

```
Peticion HTTP
    |
    v
  Router (routes.config.js)    --> define QUE ruta va a QUE controlador
    |
    v
  Controller (*.controller.js) --> recibe la request, llama al modelo, devuelve respuesta
    |
    v
  Model (*.model.js)           --> define la estructura de los datos y habla con MongoDB
```

En nuestro proyecto usamos esta estructura (del PRD):

```
api/
  app.js              --> crea la app Express, registra middlewares, monta el router
  server.js           --> conecta la DB y arranca app.listen()
  config/
    db.config.js       --> URI de MongoDB
    routes.config.js   --> router unico con todas las rutas
  controllers/         --> handlers de las peticiones
  middlewares/         --> funciones intermedias (auth, errores, upload...)
  models/              --> esquemas de Mongoose
  data/                --> seed y coleccion Postman
```

### Por que separar app.js y server.js

- `app.js` crea y configura la aplicacion Express (middlewares, rutas, error handler). Exporta `app`.
- `server.js` importa `app`, conecta a la base de datos y arranca el servidor con `app.listen()`.

Esta separacion permite reutilizar `app` en tests sin levantar el servidor real.

### Middleware: que es y como funciona

Un middleware es una funcion que se ejecuta ANTES de que la peticion llegue al handler final. Se registran con `app.use()`.

```js
app.use(express.json());   // parsea el body JSON de las peticiones
app.use(logger("dev"));    // imprime logs de cada peticion en consola
```

Los middlewares se ejecutan en orden. Si no llamas a `next()`, la peticion se queda "colgada".

### Conexion a MongoDB con Mongoose

Mongoose es un ODM (Object Document Mapper): traduce documentos de MongoDB a objetos de JavaScript.

```js
import mongoose from "mongoose";

// La DB se crea automaticamente si no existe
mongoose.connect("mongodb://127.0.0.1:27017/nombre-db");
```

Regla importante: conecta la DB ANTES de hacer `app.listen()`. Si la DB falla, el servidor no deberia arrancar.

### Que es un .env y para que sirve

Un archivo `.env` guarda variables de configuracion (puertos, URIs, secretos) fuera del codigo. Nunca se sube a Git.

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/retail-catalog-dev
```

Para leerlas en Node usamos el paquete `dotenv` (o en Express 5, se puede usar `--env-file`).

### Express 5 vs Express 4

Express 5 es la version mas reciente. Diferencias que nos importan:
- Captura automaticamente errores en handlers async (no necesitas try/catch en controllers).
- Se instala como `express@5`.

---

## Tareas (~3.5h)

### Tarea 1 — Inicializar el proyecto Node (~15min)

1. Crea la carpeta `api/` dentro de tu proyecto.
2. Abre terminal en `api/` y ejecuta:

```bash
npm init -y
```

3. Abre `package.json` y anade `"type": "module"` para usar import/export:

```json
{
  "name": "api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "npx nodemon server.js",
    "start": "node server.js"
  }
}
```

### Tarea 2 — Instalar dependencias (~10min)

```bash
npm install express@5 mongoose morgan dotenv http-errors cors cookie-parser jsonwebtoken bcrypt multer cloudinary multer-storage-cloudinary
npm install -D nodemon
```

Que hace cada una:
- `express@5`: framework web (version 5 con async error handling).
- `mongoose`: ODM para MongoDB.
- `morgan`: logs de peticiones HTTP en consola.
- `dotenv`: carga variables del archivo `.env`.
- `http-errors`: crea errores HTTP con status code (ej: `createHttpError(404, "Not found")`).
- `cors`: permite peticiones cross-origin desde el frontend.
- `cookie-parser`: parsea las cookies de la request (necesario para leer el JWT).
- `jsonwebtoken`: firma y verifica tokens JWT (autenticacion, dias 5-6).
- `bcrypt`: hashea passwords.
- `multer` + `cloudinary` + `multer-storage-cloudinary`: subida de imagenes (dia 8).
- `nodemon` (dev): reinicia el servidor cuando cambias archivos.

### Tarea 3 — Crear la estructura de carpetas (~10min)

Dentro de `api/`, crea estas carpetas vacias y archivos:

```
api/
  config/
    db.config.js
    routes.config.js
    categories.config.js
  controllers/       (vacia por ahora)
  middlewares/       (vacia por ahora)
  models/            (vacia por ahora)
  data/              (vacia por ahora)
  app.js
  server.js
  .env
  .gitignore
```

### Tarea 4 — Archivo .env (~5min)

Crea `api/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/retail-catalog-dev
TOKEN_SECRET=cambia_esto_por_una_cadena_larga_y_aleatoria
```

> `TOKEN_SECRET` es la clave con la que firmaremos los JWT en los dias 5-6. Tiene que ser una cadena larga y aleatoria — no uses la de este ejemplo en produccion.

Crea `api/.gitignore`:

```
node_modules
.env
```

### Tarea 5 — Configuracion de base de datos (~15min)

Crea `api/config/db.config.js`:

```js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/retail-catalog-dev";

export function connectDB() {
  return mongoose.connect(MONGODB_URI)
    .then((connection) => {
      console.log(`Connected to MongoDB: "${connection.connections[0].name}"`);
    });
}
```

Puntos clave:
- Exportamos una funcion que devuelve la promesa de conexion.
- Si no hay variable de entorno, usa un fallback local.
- El `console.log` confirma la conexion y muestra el nombre de la DB.

### Tarea 6 — Lista predefinida de categorias (~10min)

Las categorias no son un modelo de base de datos — son una lista fija definida en codigo. Crea `api/config/categories.config.js`:

```js
export const CATEGORIES = [
  "Electronica",
  "Ropa",
  "Alimentacion",
  "Hogar",
  "Deportes",
  "Juguetes",
  "Libros",
  "Belleza",
  "Herramientas",
  "Otros",
];
```

> Ajusta la lista a tu tipo de tienda. El frontend usara este endpoint para pintar los filtros del catalogo y los checkboxes del formulario de producto.

### Tarea 7 — Router con health check y categorias (~20min)

Crea `api/config/routes.config.js`:

```js
import { Router } from "express";
import createHttpError from "http-errors";
import { CATEGORIES } from "./categories.config.js";

const router = Router();

// Health check — verifica que la API esta viva
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Devuelve la lista predefinida de categorias
router.get("/categories", (req, res) => {
  res.json(CATEGORIES);
});

// 404 catch-all (tiene que ir AL FINAL del router)
router.use(() => {
  throw createHttpError(404, "Route not found");
});

export default router;
```

Puntos clave:
- Usamos `Router()` para agrupar todas las rutas en un solo lugar.
- El health check es util para verificar que el servidor responde.
- El 404 catch-all captura cualquier ruta que no exista. SIEMPRE va al final.

### Tarea 8 — app.js (~20min)

Crea `api/app.js`:

```js
import express from "express";
import logger from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./config/routes.config.js";

const app = express();

// Middlewares globales
app.use(logger("dev"));
app.use(cors({ origin: process.env.ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Montar todas las rutas bajo /api
app.use("/api", router);

export default app;
```

Puntos clave:
- `cookieParser()` es necesario para leer las cookies donde guardaremos el JWT (dias 5-6).
- `credentials: true` en CORS permite que el navegador envie cookies en peticiones cross-origin.
- Exportamos `app` (no hacemos listen aqui).

### Tarea 9 — server.js (~20min)

Crea `api/server.js`:

```js
import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.config.js";

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
```

Puntos clave:
- `import "dotenv/config"` carga las variables del `.env` ANTES de todo lo demas.
- Primero conecta la DB, y SOLO si funciona arranca el servidor.
- Si la DB falla, `process.exit(1)` cierra la app (fail fast).

### Tarea 10 — Probar que todo funciona (~15min)

1. Asegurate de tener MongoDB corriendo en tu maquina.
2. Ejecuta:

```bash
cd api
npm run dev
```

3. Deberias ver en consola:

```
Connected to MongoDB: "retail-catalog-dev"
Server running on http://localhost:3000
```

4. Abre Postman y prueba:
   - `GET http://localhost:3000/api/health` → deberia devolver `{ "status": "ok" }`
   - `GET http://localhost:3000/api/categories` → deberia devolver el array de categorias
   - `GET http://localhost:3000/api/lo-que-sea` → deberia devolver `{ "message": "Route not found" }` con status 404

5. En la consola deberia aparecer algo como:

```
GET /api/health 200 3.456 ms
GET /api/categories 200 1.234 ms
GET /api/lo-que-sea 404 0.789 ms
```

Eso es Morgan funcionando.

---

## Refuerzo (~30min)

- Revisa cada archivo y asegurate de que entiendes que hace cada linea.
- Prueba a romper cosas a proposito: quita el `express.json()`, cambia el puerto, pon mal la URI de MongoDB. Observa que errores salen y como se comporta.
- Abre MongoDB Compass y comprueba que se ha creado la base de datos `retail-catalog-dev`.

---

## Checklist

- [ ] Carpeta `api/` creada con `package.json` configurado (type module, scripts)
- [ ] Dependencias instaladas (express@5, mongoose, morgan, dotenv, http-errors, cors, cookie-parser, jsonwebtoken, bcrypt, multer, cloudinary, multer-storage-cloudinary)
- [ ] Estructura de carpetas completa (config, controllers, middlewares, models, data)
- [ ] `.env` con PORT, MONGODB_URI y TOKEN_SECRET
- [ ] `.gitignore` con node_modules y .env
- [ ] `db.config.js` con funcion de conexion
- [ ] `categories.config.js` con la lista predefinida
- [ ] `routes.config.js` con health check, GET /categories y 404 catch-all
- [ ] `app.js` con cors, cookieParser y router montado en /api
- [ ] `server.js` con conexion DB + listen
- [ ] Servidor arranca sin errores
- [ ] GET /api/health devuelve 200 y `{ status: "ok" }`
- [ ] GET /api/categories devuelve el array de categorias
- [ ] GET /api/ruta-inexistente devuelve 404
- [ ] Morgan muestra logs en consola
