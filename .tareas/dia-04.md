# Dia 4 — Seed del primer admin + middlewares

> Objetivo: crear el script de seed que genera el primer administrador y los 3 middlewares transversales del proyecto (error handler, clearBody, validateObjectId). Son piezas que usaran TODOS los endpoints.

---

## Estudio (~1.5h)

### La cadena de middlewares de Express

Antes de entender el error handler, hay que entender como funciona el flujo de una peticion en Express:

```
Peticion entrante
  |
  +--> middleware 1 (logger)         → llama next() → pasa al siguiente
  |
  +--> middleware 2 (express.json)   → llama next() → pasa al siguiente
  |
  +--> middleware 3 (clearBody)      → llama next() → pasa al siguiente
  |
  +--> router (rutas)
        |
        +--> controller               → res.json() → TERMINA
        |
        +--> (si ocurre un error)     → next(error) → salta al error handler
  |
  +--> error handler (4 params)      → res.json() → TERMINA
```

Cada middleware recibe `(req, res, next)`. Para pasar el control al siguiente middleware, llama `next()`. Para pasar un error al error handler, llama `next(error)` o simplemente hace `throw error` (Express 5 lo captura automaticamente en handlers async).

Lo importante: **el error handler debe registrarse al final de app.js**, despues de todas las rutas. Si lo pones antes, los errores de las rutas no llegan a el.

### Que es un seed y para que sirve

Un seed es un script que llena la base de datos con datos iniciales. En nuestro proyecto, el primer admin no se puede registrar por la web (el registro requiere un token de invitacion que genera otro admin). Es el problema del huevo y la gallina: necesitamos un admin para crear admins. La solucion es un seed.

Flujo del seed:
1. Conectar a la base de datos.
2. Limpiar los datos previos (opcional, depende del caso).
3. Crear los datos iniciales.
4. Cerrar la conexion.

```js
async function seed() {
  await mongoose.connect(MONGODB_URI);
  await User.deleteMany({});            // limpiar
  await User.create({ /* datos */ });   // crear
  await mongoose.connection.close();    // cerrar
}
```

Es importante cerrar la conexion al final. Si no lo haces, el proceso se queda "colgado" y no termina nunca.

### Middleware de errores — la pieza mas importante

Un middleware de errores es una funcion con **4 parametros**: `(err, req, res, next)`. Express solo la reconoce como middleware de errores si tiene exactamente 4 parametros.

Se registra al FINAL de `app.js`, despues de todas las rutas. Cualquier error que ocurra (o que se lance con `throw`) llega aqui.

```
Peticion --> middlewares --> rutas --> (error?) --> error handler --> respuesta
```

En nuestro proyecto, el error handler debe distinguir 5 tipos de errores:

```
Error llega al handler
  |
  +-- Mongoose ValidationError?  --> 400 + { errors: err.errors }
  |
  +-- Mongoose CastError?        --> 404 (ID con formato invalido)
  |
  +-- MongoDB E11000 (duplicado)? --> 409 (conflicto, ej: email duplicado)
  |
  +-- Tiene err.status? (http-errors) --> usar ese status + { message }
  |
  +-- Cualquier otro              --> 500 + log en consola
```

Orden importante: evaluamos los errores de Mongoose PRIMERO, porque son los mas especificos. Los errores de http-errors van despues.

### http-errors — crear errores con status code

La libreria `http-errors` (que ya instalamos el dia 1) crea objetos de error con un codigo HTTP asociado:

```js
import createHttpError from "http-errors";

throw createHttpError(404, "Product not found");
// Crea un error con: err.status = 404, err.message = "Product not found"

throw createHttpError(401, "Invalid credentials");
// err.status = 401, err.message = "Invalid credentials"
```

Importante: la propiedad se llama `err.status`, NO `err.statusCode`. Esto es especifico de http-errors.

### Express 5 y async handlers

Express 5 captura automaticamente los errores en handlers `async`. Si un `await` falla o haces `throw`, Express llama a `next(error)` por ti. Esto significa que NO necesitas `try/catch` en los controllers:

```js
// Express 5: sin try/catch
export async function detail(req, res) {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createHttpError(404, "Product not found");  // Express 5 lo captura
  }

  res.json(product);
}
```

### Middleware clearBody — proteccion del body

Cuando el cliente envia un body, puede incluir campos que no deberia poder modificar (como `_id`, `createdAt`, `updatedAt`). El middleware `clearBody` los elimina antes de que lleguen al controller:

```js
export function clearBody(req, res, next) {
  delete req.body?._id;
  delete req.body?.createdAt;
  delete req.body?.updatedAt;
  next();
}
```

Se registra como middleware global en `app.js`, justo despues de `express.json()`.

### Middleware validateObjectId — validar IDs en params

Cuando una ruta recibe un `:id`, ese ID puede tener un formato invalido (ej: "abc123"). Mongoose lanzaria un `CastError`, pero es mejor validarlo antes:

```js
import mongoose from "mongoose";
import createHttpError from "http-errors";

export function validateObjectId(req, res, next) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, `Invalid ID: ${id}`);
  }

  next();
}
```

Este middleware se usara en las rutas que reciben `:id` como parametro.

---

## Tareas (~3h)

### Tarea 1 — Crear el error handler (~45min)

Crea `api/middlewares/error-handler.middleware.js`:

```js
export function errorHandler(err, req, res, next) {
  // 1. Mongoose ValidationError -> 400
  if (err.name === "ValidationError") {
    return res.status(400).json({ errors: err.errors });
  }

  // 2. Mongoose CastError -> 404
  if (err.name === "CastError") {
    return res.status(404).json({ message: "Resource not found" });
  }

  // 3. MongoDB duplicate key (E11000) -> 409
  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate key error" });
  }

  // 4. http-errors (tiene err.status) -> usar ese status
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  // 5. Cualquier otro error -> 500
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}
```

### Tarea 2 — Crear el middleware clearBody (~10min)

Crea `api/middlewares/clear-body.middleware.js`:

```js
export function clearBody(req, res, next) {
  delete req.body?._id;
  delete req.body?.createdAt;
  delete req.body?.updatedAt;
  next();
}
```

### Tarea 3 — Crear el middleware validateObjectId (~15min)

Crea `api/middlewares/validate-object-id.middleware.js`:

```js
import mongoose from "mongoose";
import createHttpError from "http-errors";

export function validateObjectId(req, res, next) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, `Invalid ID: ${id}`);
  }

  next();
}
```

### Tarea 4 — Integrar los middlewares en app.js (~30min)

Actualiza `api/app.js` para anadir los nuevos middlewares (cors, cookieParser y express.json ya estaban del dia 1, ahora anadimos clearBody y errorHandler):

```js
import express from "express";
import logger from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./config/routes.config.js";
import { clearBody } from "./middlewares/clear-body.middleware.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";

const app = express();

// Middlewares globales
app.use(logger("dev"));
app.use(cors({ origin: process.env.ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(clearBody);

// Montar todas las rutas bajo /api
app.use("/api", router);

// Error handler (SIEMPRE al final, despues de rutas)
app.use(errorHandler);

export default app;
```

Puntos clave:
- `clearBody` va despues de `express.json()` (primero parsea, luego limpia).
- `errorHandler` va al FINAL, despues de todas las rutas.
- `validateObjectId` NO va aqui — se usara por ruta cuando lo necesitemos.

### Tarea 5 — Actualizar el 404 catch-all del router (~10min)

Actualiza el 404 catch-all en `api/config/routes.config.js` para que use `http-errors` y pase el error al error handler (en lugar de responder directamente). El resto del router (health, categories) ya estaba del dia 1:

```js
// 404 catch-all (al final del router, SIEMPRE lo ultimo)
router.use((req, res, next) => {
  next(createHttpError(404, "Route not found"));
});
```

Ahora el 404 pasa por el error handler y tiene el mismo formato que todos los demas errores.

### Tarea 6 — Crear el seed del primer admin + datos de ejemplo (~45min)

Crea `api/bin/seed.js`. En lugar de escribir todos los datos a mano, usa `@faker-js/faker` para generar datos de ejemplo mas rapido y con menos ruido visual. La idea sigue siendo la misma: crear el primer admin y dejar productos + reviews suficientes para probar la app cuando llegues al frontend.

Primero instala Faker en la API:

```bash
cd api
npm install @faker-js/faker
```

Despues crea el script en `api/bin/seed.js`:

```js
import "dotenv/config";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import User from "../models/User.model.js";
import Product from "../models/Product.model.js";
import Review from "../models/Review.model.js";
import { CATEGORIES } from "../config/categories.config.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/retail-catalog-dev";

const ADMIN_DATA = {
  name: "Admin",
  email: "admin@retailcatalog.com",
  password: "admin1234",
};

function pickCategories() {
  return faker.helpers.arrayElements(CATEGORIES, faker.number.int({ min: 1, max: 2 }));
}

function createProduct(adminId) {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: Number(faker.commerce.price({ min: 10, max: 120 })),
    stock: faker.number.int({ min: 0, max: 30 }),
    categories: pickCategories(),
    owner: adminId,
  };
}

function createReview(productId) {
  return {
    email: faker.internet.email().toLowerCase(),
    rating: faker.number.int({ min: 1, max: 5 }),
    product: productId,
  };
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    // Limpiar datos anteriores
    await Review.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log("Previous data cleared");

    // Crear admin
    const admin = await User.create(ADMIN_DATA);
    console.log(`Admin created: ${admin.email}`);

    // Crear productos de ejemplo
    const productDocs = Array.from({ length: 15 }, () => createProduct(admin._id));
    const products = await Product.create(productDocs);
    console.log(`${products.length} products created`);

    // Crear algunas reviews repartidas entre varios productos
    const reviewDocs = [
      createReview(products[0]._id),
      createReview(products[0]._id),
      createReview(products[1]._id),
      createReview(products[7]._id),
    ];

    const reviews = await Review.create(reviewDocs);
    console.log(`${reviews.length} reviews created`);

    console.log("\nSeed completed successfully!");
    console.log("Login: admin@retailcatalog.com / admin1234");
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("DB connection closed");
  }
}

seed();
```

Notas sobre el seed:
- Limpia TODO antes de crear. Asi puedes ejecutarlo cuantas veces quieras para "resetear" la base de datos.
- Usa `faker` para generar nombres, descripciones, precios, stock y emails sin tener que mantener un array enorme a mano.
- Las categorias siguen siendo strings del array predefinido `CATEGORIES`, no ObjectIds ni una coleccion `Category`.
- Algunos productos deberian salir con multiples categorias y stocks variados (0, bajo, normal). Si Faker no te da justo lo que quieres al primer intento, puedes fijar uno o dos casos manuales despues de generar el array.
- Hay 15 productos, suficiente para probar paginacion (limit 12 = 2 paginas).
- Las reviews de ejemplo siguen sirviendo para comprobar relaciones y datos en el frontend sin complicar el script.

Anade el script de seed a `package.json`:

```json
"scripts": {
  "dev": "npx nodemon server.js",
  "start": "node server.js",
  "seed": "node bin/seed.js"
}
```

### Tarea 7 — Probar el seed (~15min)

```bash
cd api
npm run seed
```

Deberia mostrar:
```
Connected to DB
Previous data cleared
Admin created: admin@retailcatalog.com
15 products created
4 reviews created

Seed completed successfully!
Login: admin@retailcatalog.com / admin1234
DB connection closed
```

Comprueba en MongoDB Compass:
- Coleccion `users` tiene 1 documento.
- Coleccion `products` tiene 15 documentos (sin coleccion `categories`).
- Coleccion `reviews` tiene 4 documentos.
- El password del admin esta hasheado (empieza por `$2b$10$`).
- Cada producto tiene `categories` como array de strings y un `owner` (ObjectId).
- Hay productos con stock variado y categorias validas de `CATEGORIES`.

### Tarea 8 — Probar el error handler (~30min)

Arranca el servidor (`npm run dev`) y prueba con Postman:

1. **Ruta inexistente** → `GET http://localhost:3000/api/nada`
   - Esperado: 404 + `{ "message": "Route not found" }`

2. **Health check** → `GET http://localhost:3000/api/health`
   - Esperado: 200 + `{ "status": "ok" }`

El error handler todavia no tiene mucho que manejar porque no tenemos endpoints con modelos. Pero cuando creemos los controllers (dias 5-8), todos los errores pasaran por aqui automaticamente.

---

## Refuerzo (~30min)

- Lee el error handler linea por linea. Asegurate de que entiendes cada `if` y que tipo de error captura.
- Preguntate: si un controller hace `throw createHttpError(409, "Email already in use")`, que camino sigue en el error handler? (Respuesta: el bloque `if (err.status)`).
- Preguntate: si hago `await Product.create({})` sin campos required, que error sale? (Respuesta: `ValidationError`, bloque 1 del handler).

---

## Checklist

- [ ] `error-handler.middleware.js` creado con los 5 bloques de errores
- [ ] `clear-body.middleware.js` creado
- [ ] `validate-object-id.middleware.js` creado
- [ ] `app.js` actualizado con clearBody y errorHandler
- [ ] Error handler registrado AL FINAL de app.js
- [ ] 404 catch-all en routes.config.js usa createHttpError
- [ ] `bin/seed.js` creado (sin modelo Category)
- [ ] Script `seed` anadido a package.json
- [ ] Faker instalado y usado para generar datos de ejemplo
- [ ] Seed crea el admin + 15 productos + 4 reviews de ejemplo
- [ ] Seed se puede ejecutar varias veces (limpia y recrea)
- [ ] Password del admin esta hasheado en la DB
- [ ] Productos usan `categories: [String]` (no ObjectId de categoria)
- [ ] Algunos productos tienen multiples categorias
- [ ] Productos tienen stocks variados (0, bajo, normal)
- [ ] GET /api/nada devuelve 404 con formato JSON
- [ ] GET /api/health sigue funcionando
