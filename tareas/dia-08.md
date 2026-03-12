# Dia 8 — Reviews endpoints + Multer + Cloudinary

> Objetivo: implementar el endpoint de reviews de productos (publico — cualquier visitante puede valorar) e integrar la subida de imagenes con Multer + Cloudinary. Al terminar, el backend esta completo.

---

## Estudio (~1h)

### Reviews — endpoint anidado

Las reviews viven bajo el producto al que pertenecen: `POST /api/products/:id/reviews`. Esto se llama **ruta anidada** y refleja la relacion: una review pertenece a un producto.

```
POST /api/products/:id/reviews     --> crear review para ese producto
GET  /api/products/:id/reviews     --> listar reviews de ese producto
```

El `:id` es el ID del producto. La review que se crea tendra ese producto como referencia.

### Por que el endpoint de reviews es publico

Los visitantes del catalogo no tienen cuenta. Pueden valorar un producto solo con su email. El email sirve para:
1. Garantizar una sola valoracion por email+producto (indice compuesto).
2. Posible uso futuro para boletin de noticias.

El endpoint de crear review no lleva `isAuthenticated`. Cualquiera puede llamarlo.

### Por que express.json() no puede manejar archivos

Cuando un formulario envia solo texto o JSON, el `Content-Type` es `application/json` y Express lo procesa con `express.json()`. Pero cuando envias un archivo, el navegador usa `multipart/form-data`:

```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXYZ
```

Este formato divide el cuerpo de la peticion en partes separadas por un "boundary" (delimitador). Una parte puede ser un campo de texto, otra puede ser un archivo binario. `express.json()` no sabe leer este formato — necesitas Multer.

### Multer — storage engines

Multer necesita saber donde guardar el archivo. Para eso usa un **storage engine**:

| Storage engine | Que hace | Cuando usarlo |
|---|---|---|
| `diskStorage` | Guarda el archivo en disco del servidor | Desarrollo rapido sin nube |
| `memoryStorage` | Guarda el archivo en RAM como Buffer | Cuando lo vas a reenviar a otro servicio |
| `CloudinaryStorage` | Sube directamente a Cloudinary | Nuestro caso — produccion |

Con `CloudinaryStorage`, el archivo nunca toca el disco del servidor. Va directamente de la peticion a Cloudinary. A cambio, `req.file.path` ya contiene la URL publica de Cloudinary en lugar de una ruta local.

### Flujo completo con Cloudinary

```
Cliente (form-data con imagen)
  --> Multer (intercepta el archivo del body)
    --> CloudinaryStorage (sube a Cloudinary automaticamente)
      --> req.files[0].path = "https://res.cloudinary.com/..."
        --> Controller guarda esa URL en el modelo
```

Nuestro caso: hasta 3 imagenes por producto, con `upload.array("images", 3)`.

Cuando el admin crea o edita un producto con imagenes, el form lo envia como `multipart/form-data` (no JSON). Los campos de texto llegan en `req.body` igual que antes, pero los archivos llegan en `req.files` (array) o `req.file` (uno solo).

### req.file vs req.files

- `upload.single("imagen")` → `req.file` (objeto con un archivo)
- `upload.array("imagenes", 3)` → `req.files` (array de hasta 3 archivos)

En nuestro controller:
```js
const images = req.files ? req.files.map((file) => file.path) : [];
```

Si no se suben imagenes, `req.files` es un array vacio o `undefined`, y `images` queda como `[]`. El modelo tiene `default: []`, asi que el producto se crea sin imagenes sin errores.

### Editar imagenes (PATCH)

Al editar, si se suben nuevas imagenes reemplazan las anteriores (MVP: no hay gestion individual de imagenes).

---

## Tareas (~3.5h)

### Tarea 1 — Crear cuenta en Cloudinary + credenciales (~15min)

1. Ve a cloudinary.com y crea una cuenta gratuita.
2. En el dashboard, copia Cloud name, API key y API secret.
3. Anadir a `api/.env`:

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### Tarea 2 — Configurar Cloudinary (~15min)

Crea `api/config/cloudinary.config.js`:

```js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "retail-catalog",
    allowed_formats: ["jpg", "png", "webp"],
  },
});
```

### Tarea 3 — Crear el middleware de upload (~10min)

Crea `api/middlewares/upload.middleware.js`:

```js
import multer from "multer";
import { storage } from "../config/cloudinary.config.js";

export const upload = multer({ storage });
```

### Tarea 4 — Actualizar rutas de productos con upload (~15min)

Actualiza las rutas de POST y PATCH en `routes.config.js`:

```js
import { upload } from "../middlewares/upload.middleware.js";

// Actualizar estas dos rutas (el resto no cambia):
router.post(
  "/products",
  isAuthenticated,
  upload.array("images", 3),
  ProductsController.create
);
router.patch(
  "/products/:id",
  isAuthenticated,
  validateObjectId,
  upload.array("images", 3),
  ProductsController.update
);
```

### Tarea 5 — Actualizar el controller de productos para imagenes (~20min)

Actualiza `create` y `update` en `products.controller.js`:

```js
export async function create(req, res) {
  const images = req.files ? req.files.map((file) => file.path) : [];

  const product = await Product.create({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    stock: req.body.stock,
    categories: req.body.categories,
    barcode: req.body.barcode || undefined,
    owner: req.userId,
    images,
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

  if (req.body.barcode !== undefined) {
    updateData.barcode = req.body.barcode || undefined;
  }

  if (req.files && req.files.length > 0) {
    updateData.images = req.files.map((file) => file.path);
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
```

### Tarea 6 — Crear el controller de reviews (~30min)

Crea `api/controllers/reviews.controller.js`:

```js
import createHttpError from "http-errors";
import Review from "../models/Review.model.js";
import Product from "../models/Product.model.js";

export async function list(req, res) {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createHttpError(404, "Product not found");
  }

  const reviews = await Review.find({ product: req.params.id })
    .sort({ createdAt: -1 });

  res.json(reviews);
}

export async function create(req, res) {
  const { email, rating } = req.body;

  if (!email || !rating) {
    throw createHttpError(400, "Email and rating are required");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createHttpError(404, "Product not found");
  }

  const review = await Review.create({
    email,
    rating,
    product: req.params.id,
  });

  res.status(201).json(review);
}
```

Puntos clave:
- `list` devuelve las reviews ordenadas por mas recientes primero.
- `create` es publico — no lleva `isAuthenticated`.
- Si el mismo email intenta valorar el mismo producto dos veces, el indice compuesto lanza E11000 → el error handler devuelve 409.

### Tarea 7 — Anadir rutas de reviews (~15min)

Actualiza `routes.config.js` anadiendo las rutas de reviews (rutas anidadas bajo /products/:id):

```js
import * as ReviewsController from "../controllers/reviews.controller.js";

// Reviews (anidadas bajo productos)
router.get("/products/:id/reviews", validateObjectId, ReviewsController.list);     // publica
router.post("/products/:id/reviews", validateObjectId, ReviewsController.create);  // publica
```

> Atencion: estas rutas tienen `:id` pero NO llevan `isAuthenticated` — los visitantes pueden ver y crear reviews sin cuenta.

### Tarea 8 — Probar subida de imagenes con Postman (~30min)

Para enviar archivos en Postman, usa **form-data** (no JSON).

**Crear producto con imagenes:**
1. `POST http://localhost:3000/api/products`
2. Body: "form-data"
3. Campos:
   - `name` (Text): "Camiseta con foto"
   - `price` (Text): "29.99"
   - `stock` (Text): "10"
   - `categories` (Text): "Ropa"
   - `images` (File): selecciona una imagen
4. Esperado: 201 + `images: ["https://res.cloudinary.com/..."]`

**Verificar en Cloudinary:**
Dashboard → Media Library → carpeta "retail-catalog".

### Tarea 9 — Probar reviews con Postman (~20min)

**Crear review (sin login):**
```
POST http://localhost:3000/api/products/<id>/reviews
Body (JSON): { "email": "visitante@test.com", "rating": 5 }
```
Esperado: 201 + la review creada.

**Crear segunda review mismo email+producto:**
```
POST http://localhost:3000/api/products/<id>/reviews
Body (JSON): { "email": "visitante@test.com", "rating": 3 }
```
Esperado: 409 (E11000).

**Listar reviews:**
```
GET http://localhost:3000/api/products/<id>/reviews
```
Esperado: array con las reviews.

**Mismo email, producto distinto:**
Esperado: 201 (puede valorar otros productos con el mismo email).

---

## Refuerzo (~30min)

- Mira en Compass la coleccion `reviews` — deberia tener el campo `product` como ObjectId.
- Verifica en Compass que las imagenes de los productos son URLs de Cloudinary.
- Comprueba que el endpoint de reviews devuelve 404 si el producto no existe.

---

## Checklist

- [ ] Cuenta de Cloudinary creada, credenciales en .env
- [ ] `cloudinary.config.js` con storage configurado
- [ ] `upload.middleware.js` creado
- [ ] Rutas POST y PATCH de productos incluyen `upload.array("images", 3)`
- [ ] Controller `create` extrae URLs de `req.files`
- [ ] Controller `update` reemplaza imagenes si se suben nuevas
- [ ] Crear producto con imagenes → URLs de Cloudinary en la respuesta
- [ ] Crear producto sin imagenes → `images: []`
- [ ] `reviews.controller.js` creado con `list` y `create`
- [ ] Rutas de reviews anadidas (GET y POST `/products/:id/reviews`)
- [ ] Endpoint de crear review es publico (sin isAuthenticated)
- [ ] Review con rating invalido devuelve 400
- [ ] Review duplicada (mismo email+producto) devuelve 409
- [ ] El mismo email puede valorar productos distintos
- [ ] Imagenes visibles en el dashboard de Cloudinary
