# Dia 7 — Productos CRUD completo + paginacion + filtros

> Objetivo: implementar el CRUD completo de productos con paginacion, filtro por categoria y busqueda por nombre. Es el endpoint mas grande del backend. Las imagenes se anaden en el dia 8.

---

## Estudio (~45min)

### Patron de un CRUD en nuestro proyecto

Todos los CRUDs siguen el mismo patron. Entenderlo bien aqui te ahorrara tiempo:

**1. Controller** — funciones async que reciben `req` y `res`:
```js
export async function list(req, res) {
  const items = await Model.find();
  res.json(items);
}

export async function create(req, res) {
  const item = await Model.create(req.body);
  res.status(201).json(item);
}

export async function update(req, res) {
  const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) throw createHttpError(404, "Not found");
  res.json(item);
}

export async function remove(req, res) {
  const item = await Model.findByIdAndDelete(req.params.id);
  if (!item) throw createHttpError(404, "Not found");
  res.status(204).end();
}
```

**2. Rutas** — conectar metodo HTTP + path + middlewares + controller:
```js
router.get("/products", ProductsController.list);
router.post("/products", isAuthenticated, ProductsController.create);
router.patch("/products/:id", isAuthenticated, validateObjectId, ProductsController.update);
router.delete("/products/:id", isAuthenticated, validateObjectId, ProductsController.remove);
```

### Paginacion con Mongoose

Cuando tienes muchos documentos, no puedes devolver todos en una sola respuesta. Usamos `skip()` y `limit()`:

```js
const page = 1;
const limit = 12;

const products = await Product.find()
  .skip((page - 1) * limit)   // saltar los documentos de paginas anteriores
  .limit(limit);               // devolver solo N documentos
```

`skip((page - 1) * limit)` calcula cuantos documentos saltar:
- Pagina 1: skip(0) → los primeros 12
- Pagina 2: skip(12) → del 13 al 24
- Pagina 3: skip(24) → del 25 al 36

Formato de respuesta paginada (segun el PRD):
```json
{
  "meta": { "page": 1, "limit": 12, "total": 47, "totalPages": 4 },
  "data": [ ... ]
}
```

Limitamos los valores de `page` y `limit` para evitar que un cliente pida `limit=99999` y nos tumbe la API:
- `page`: minimo 1 (no hay pagina 0 ni negativa)
- `limit`: entre 1 y 50 (50 es un maximo razonable para un catalogo)

### Promise.all — consultas en paralelo

El endpoint de listado necesita dos cosas: los productos de la pagina actual y el total de documentos (para calcular `totalPages`). Podriamos hacerlo en secuencia:

```js
// Secuencial: 2 queries, una detras de otra (~200ms total si cada una tarda 100ms)
const products = await Product.find(filter).skip(...).limit(...);
const total = await Product.countDocuments(filter);
```

Pero las dos queries son independientes — no necesitan el resultado de la otra. `Promise.all` las lanza en paralelo:

```js
// Paralelo: 2 queries al mismo tiempo (~100ms total)
const [products, total] = await Promise.all([
  Product.find(filter).skip(...).limit(...),
  Product.countDocuments(filter),
]);
```

`Promise.all` recibe un array de promesas y devuelve una promesa que se resuelve cuando TODAS terminan. El resultado es un array con los resultados en el mismo orden. Si cualquiera falla, `Promise.all` falla (Express lo captura y va al error handler).

### $regex — busqueda por texto parcial

Para buscar productos cuyo nombre contiene un texto (como el `LIKE '%texto%'` de SQL), usamos el operador `$regex` de MongoDB:

```js
if (search) {
  filter.name = { $regex: search, $options: "i" };
}
```

- `$regex: search` — el valor buscado puede estar en cualquier parte del string.
- `$options: "i"` — insensible a mayusculas/minusculas (buscar "camisa" encuentra "Camisa", "CAMISA", "cAmIsA").

Es equivalente a `SQL: WHERE name ILIKE '%search%'`.

Alternativa mas explicita con el constructor `RegExp`:
```js
filter.name = new RegExp(search, "i");  // mismo resultado
```

### Filtros dinamicos

Los filtros llegan como query params: `GET /api/products?category=Ropa&search=cam&page=2`

Como `categories` es un array de strings (no un ObjectId), el filtro es mas sencillo de lo que parece:

```js
if (category) {
  filter.categories = category;  // MongoDB busca documentos donde categories contiene ese string
}
```

MongoDB entiende que si `categories` es un array, `filter.categories = "Ropa"` busca documentos donde "Ropa" esta EN el array. No necesitas el operador `$in` para este caso — es la magia del matching de arrays en MongoDB.

### Barcode lookup

El endpoint `GET /api/products/barcode/:code` es especial — va ANTES de `GET /api/products/:id` en el router, porque si va despues, Express interpretaria "barcode" como un ID.

```js
router.get("/products/barcode/:code", isAuthenticated, ProductsController.findByBarcode);
router.get("/products/:id", validateObjectId, ProductsController.detail);
```

Express evalua las rutas en el orden en que estan registradas. Si `:id` va primero, la URL `/products/barcode` encajaria con `:id = "barcode"`, y `validateObjectId` la rechazaria con 400.

### Convenciones de respuesta

- `POST` (crear) → `201` + `res.json(doc)`
- `DELETE` → `204` + `res.end()` (sin body)
- Todo lo demas → `200` implicito

---

## Tareas (~3.5h)

### Tarea 1 — Crear el controller de productos (~1h)

Crea `api/controllers/products.controller.js`:

```js
import createHttpError from "http-errors";
import Product from "../models/Product.model.js";

export async function list(req, res) {
  const { category, search, page = 1, limit = 12 } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  // Construir filtro dinamico
  const filter = {};

  if (category) {
    filter.categories = category;  // busca en el array de categorias
  }

  if (search) {
    filter.name = { $regex: search, $options: "i" };  // busqueda case-insensitive
  }

  // Ejecutar consulta y conteo en paralelo
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("owner", "name")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    data: products,
  });
}

export async function detail(req, res) {
  const product = await Product.findById(req.params.id)
    .populate("owner", "name email avatar");

  if (!product) {
    throw createHttpError(404, "Product not found");
  }

  res.json(product);
}

export async function findByBarcode(req, res) {
  const product = await Product.findOne({ barcode: req.params.code })
    .populate("owner", "name");

  if (!product) {
    throw createHttpError(404, "Product not found");
  }

  res.json(product);
}

export async function create(req, res) {
  const product = await Product.create({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    stock: req.body.stock,
    categories: req.body.categories,  // array de strings
    barcode: req.body.barcode || undefined,
    owner: req.userId,                // viene del middleware isAuthenticated
  });

  res.status(201).json(product);
}

export async function update(req, res) {
  const updateData = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    stock: req.body.stock,
    categories: req.body.categories,
  };

  // Solo actualizar barcode si se envia explicitamente
  if (req.body.barcode !== undefined) {
    updateData.barcode = req.body.barcode || undefined;
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!product) {
    throw createHttpError(404, "Product not found");
  }

  res.json(product);
}

export async function remove(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    throw createHttpError(404, "Product not found");
  }

  res.status(204).end();
}
```

Puntos clave:
- `filter.categories = category` funciona con arrays en MongoDB — no necesitas `$in`.
- `findByBarcode` usa `findOne({ barcode: req.params.code })`, no findById.
- `owner: req.userId` viene del middleware `isAuthenticated` (no de la sesion).
- `barcode: req.body.barcode || undefined` — si el admin envia string vacio, guardamos `undefined` (Mongoose lo omite).

### Tarea 2 — Anadir rutas de productos (~20min)

Actualiza `api/config/routes.config.js` anadiendo las rutas de productos. Atencion al orden de `/barcode/:code` antes de `/:id`:

```js
import * as ProductsController from "../controllers/products.controller.js";

// Products (anadir despues de las rutas de auth)
router.get("/products", ProductsController.list);                                                       // publica
router.get("/products/barcode/:code", isAuthenticated, ProductsController.findByBarcode);              // admin (escaner)
router.get("/products/:id", validateObjectId, ProductsController.detail);                              // publica
router.post("/products", isAuthenticated, ProductsController.create);                                  // protegida
router.patch("/products/:id", isAuthenticated, validateObjectId, ProductsController.update);           // protegida
router.delete("/products/:id", isAuthenticated, validateObjectId, ProductsController.remove);          // protegida
```

> `GET /products/barcode/:code` DEBE ir ANTES de `GET /products/:id`. Express evalua las rutas en orden — si `/:id` va primero, "barcode" se interpretaria como un ID y `validateObjectId` lo rechazaria.

### Tarea 3 — Crear datos de prueba (~15min)

Si no has ejecutado el seed aun, hazlo:
```bash
npm run seed
```

Si ya lo ejecutaste y tienes datos, puedes saltarte este paso.

### Tarea 4 — Probar el CRUD con Postman (~1h)

**1. Listar todos:**
```
GET http://localhost:3000/api/products
```
Esperado: respuesta paginada `{ meta, data }`.

**2. Filtrar por categoria:**
```
GET http://localhost:3000/api/products?category=Ropa
```
Esperado: solo productos que tienen "Ropa" en su array de categorias.

**3. Buscar por nombre:**
```
GET http://localhost:3000/api/products?search=camiseta
```
Esperado: productos cuyo nombre contiene "camiseta" (case-insensitive).

**4. Paginacion:**
```
GET http://localhost:3000/api/products?page=1&limit=3
```
Esperado: 3 productos + meta con totalPages correcto.

**5. Detalle de producto:**
```
GET http://localhost:3000/api/products/<id>
```
Esperado: producto con owner populado.

**6. Crear producto (con barcode):**
```
POST http://localhost:3000/api/products
Body (JSON):
{
  "name": "Zapatillas Pro",
  "price": 89.99,
  "stock": 15,
  "categories": ["Deportes", "Ropa"],
  "barcode": "9876543210123"
}
```
Esperado: 201 + producto creado con owner asignado automaticamente desde el token.

**7. Crear producto sin barcode:**
```
POST http://localhost:3000/api/products
Body (JSON): { "name": "Test", "price": 10, "stock": 5, "categories": ["Otros"] }
```
Esperado: 201 + producto sin campo barcode.

**8. Barcode lookup:**
```
GET http://localhost:3000/api/products/barcode/9876543210123
```
Esperado: el producto creado en el paso 6.

**9. Editar stock:**
```
PATCH http://localhost:3000/api/products/<id>
Body: { "stock": 20 }
```
Esperado: 200 + producto actualizado.

**10. Categoria invalida:**
```
POST http://localhost:3000/api/products
Body: { "name": "Test", "price": 10, "stock": 5, "categories": ["Videojuegos"] }
```
Esperado: 400 (ValidationError — "Videojuegos" no esta en la lista).

**11. Barcode duplicado:**
```
POST http://localhost:3000/api/products
Body: { "name": "Otro", "price": 10, "stock": 5, "categories": ["Otros"], "barcode": "9876543210123" }
```
Esperado: 409 (E11000 — barcode ya existe).

**12. Eliminar:**
```
DELETE http://localhost:3000/api/products/<id>
```
Esperado: 204.

**13. Sin auth:**
```
POST http://localhost:3000/api/products (sin login)
```
Esperado: 401.

### Tarea 5 — Verificar que owner no se puede inyectar (~10min)

```
POST http://localhost:3000/api/products
Body: { "name": "Test", "price": 10, "stock": 5, "categories": ["Otros"], "owner": "<otro-user-id>" }
```

El producto debe crearse con el owner del JWT, no con el del body. El controller usa `owner: req.userId` y no toca `req.body.owner`.

---

## Refuerzo (~30min)

- Mira en Compass que los productos tienen `categories` como array de strings.
- Prueba `GET /products?category=Electronica` y `GET /products?category=Deportes` — deberian devolver subconjuntos distintos.
- Comprueba que un producto con categorias `["Deportes", "Ropa"]` aparece en ambos filtros.

---

## Checklist

- [ ] `products.controller.js` creado con: list, detail, findByBarcode, create, update, remove
- [ ] Rutas de productos anadidas a routes.config.js
- [ ] `/products/barcode/:code` va ANTES de `/products/:id` en el router
- [ ] GET /products y GET /products/:id son publicas
- [ ] GET /products/barcode/:code requiere auth
- [ ] POST, PATCH, DELETE requieren auth
- [ ] PATCH y DELETE usan validateObjectId
- [ ] Listado devuelve formato paginado { meta, data }
- [ ] Filtro por category funciona con arrays de strings
- [ ] Busqueda por search funciona (case-insensitive)
- [ ] Paginacion funciona (page y limit)
- [ ] create asigna owner desde req.userId (no del body)
- [ ] Barcode lookup funciona (findOne por barcode)
- [ ] Categoria invalida devuelve 400 (ValidationError)
- [ ] Barcode duplicado devuelve 409 (E11000)
- [ ] Delete devuelve 204
- [ ] Sin auth devuelve 401
