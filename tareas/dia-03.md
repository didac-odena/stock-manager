# Dia 3 — Modelos Product y Review

> Objetivo: crear los dos modelos que forman el nucleo del proyecto: Product (con categorias como array de strings y campo barcode) y Review (valoraciones de visitantes). Al terminar tendras los 3 modelos listos.

---

## Estudio (~1h)

### Schema.Types.ObjectId — referencias entre colecciones

MongoDB no tiene tablas con claves foraneas como SQL. En su lugar, los documentos guardan el `_id` de otro documento como referencia. El tipo que usamos para eso es `Schema.Types.ObjectId`:

```js
owner: {
  type: Schema.Types.ObjectId,   // el valor que se guarda en la DB es un ObjectId de MongoDB
  ref: "User",                   // indica a Mongoose qué modelo usar cuando se hace populate
  required: true,
}
```

- `Schema.Types.ObjectId` es un tipo especial de Mongoose que valida que el valor sea un ObjectId de MongoDB valido (24 caracteres hexadecimales, ej: `"64abc123def456789012abcd"`).
- `ref: "User"` no hace nada en la base de datos — es solo metadatos para que Mongoose sepa a que coleccion apuntar cuando ejecutas `.populate("owner")`.
- Sin el `ref`, el populate no sabe que modelo buscar.

### Embedding vs referencias — cuando usar cada uno

En MongoDB tienes dos formas de modelar relaciones. La eleccion importa:

| | Embedding (guardar dentro) | Referencias (guardar el _id) |
|---|---|---|
| Que es | El documento hijo vive dentro del padre | El hijo vive en su propia coleccion, el padre guarda su _id |
| Cuando usarlo | Los datos siempre se leen juntos, el hijo no existe sin el padre, el hijo no crece sin limite | Los datos se consultan por separado, el hijo puede tener vida propia, la relacion es 1:N con N grande |
| Ejemplo bueno | Direccion dentro de un pedido | Reviews de un producto |

En nuestro proyecto usamos referencias para todo porque los productos, reviews y usuarios se consultan independientemente.

### Relaciones en Mongoose — repaso rapido

En MongoDB no hay JOINs. Mongoose simula relaciones usando **referencias** (guardar el `_id` de otro documento) y **populate** (rellenar ese ID con el documento real).

**Populate directo (de hijo a padre):**
El hijo guarda el `_id` del padre. Usas `.populate("campo")` para traer los datos del padre.

```js
// Review guarda una referencia a Product
const reviewSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true }
});

// Al consultar una review, rellenas el producto
const review = await Review.findById(id).populate("product");
```

**Virtual populate (de padre a hijo, sentido inverso):**
El padre NO guarda nada. Mongoose calcula la relacion al vuelo.

```js
// Product no guarda array de reviews
productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

// Al consultar un producto, puedes traer sus reviews
const product = await Product.findById(id).populate("reviews");
```

La diferencia clave: en populate directo hay un campo fisico en la coleccion. En virtual populate no hay nada en la coleccion — Mongoose hace una query extra al vuelo cuando llamas a populate. Por eso los virtuales solo aparecen si los pides explicitamente con `.populate("reviews")` y si tienes `virtuals: true` en el `toJSON`.

### Diagrama de relaciones del proyecto

```
User (1) ─────────── (N) Product (N) ─────────── (N) Review
          owner                        product
          <-- virtual: products        <-- virtual: reviews
```

- Cada Product tiene un `owner` (ref a User) y un array de `categories` (strings).
- Desde User puedes obtener sus products con virtual populate.
- Desde Product puedes obtener sus reviews con virtual populate.
- Review guarda referencia a Product (populate directo).

### Categorias como array de strings con enum

En lugar de tener un modelo Category separado, Product guarda sus categorias como un array de strings validado contra la lista predefinida de `categories.config.js`:

```js
categories: {
  type: [String],
  enum: { values: CATEGORIES, message: "{VALUE} is not a valid category" },
  default: [],
}
```

- Un producto puede pertenecer a **varias categorias** a la vez.
- El `enum` asegura que solo se puedan usar los valores de la lista predefinida.
- Si se envia una categoria no valida, Mongoose lanza un ValidationError.

### Indice compuesto unico

El modelo Review necesita garantizar que un visitante (identificado por su email) solo puede valorar un producto una vez. Esto se implementa con un **indice compuesto**:

```js
reviewSchema.index({ email: 1, product: 1 }, { unique: true });
```

Esto crea un indice donde la combinacion `email + product` debe ser unica. Un mismo email puede dejar reviews en productos distintos, pero no puede dejar dos reviews en el mismo producto.

El `1` significa orden ascendente. Para indices simples no importa mucho, pero es la sintaxis estandar de MongoDB.

### El indice sparse — unique con valores opcionales

El campo `barcode` del producto es opcional (`required` no esta puesto) pero debe ser unico entre los productos que lo tienen. El problema: si tienes `unique: true` sin mas, MongoDB trataria todos los documentos sin barcode como si tuvieran el mismo valor `null`, y violaria la restriccion.

La solucion es `sparse: true`:

```js
barcode: {
  type: String,
  unique: true,
  sparse: true,   // el indice unico solo aplica a documentos que TIENEN el campo
}
```

Con `sparse: true`, MongoDB no incluye en el indice los documentos donde el campo es `undefined` o `null`. Resultado: puedes tener muchos productos sin barcode, y entre los que si tienen barcode, el valor es unico.

### Validacion de arrays en Mongoose

Para limitar el numero de imagenes a 3:

```js
images: {
  type: [String],
  default: [],
  validate: {
    validator: (arr) => arr.length <= 3,
    message: "A product can have a maximum of 3 images",
  },
}
```

---

## Tareas (~3.5h)

### Tarea 1 — Crear el modelo Product (~45min)

Crea `api/models/Product.model.js`:

```js
import { Schema, model } from "mongoose";
import { CATEGORIES } from "../config/categories.config.js";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: "A product can have a maximum of 3 images",
      },
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    categories: {
      type: [String],
      enum: {
        values: CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      default: [],
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,   // permite multiples documentos sin barcode (null no viola unique)
      unique: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
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

// Virtual populate: obtener las reviews de este producto
productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

const Product = model("Product", productSchema);

export default Product;
```

Puntos clave:
- `categories` es `[String]` con `enum` — Mongoose valida que cada elemento este en la lista.
- `barcode` es opcional y unico. `sparse: true` permite que varios productos no tengan barcode (sin `sparse`, Mongoose trataria `null` como un valor y violaria la restriccion `unique`).
- El virtual `reviews` permite popular las valoraciones del producto.

### Tarea 2 — Crear el modelo Review (~30min)

Crea `api/models/Review.model.js`:

```js
import { Schema, model } from "mongoose";

const reviewSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
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

// Indice compuesto: un email solo puede valorar cada producto una vez
reviewSchema.index({ email: 1, product: 1 }, { unique: true });

const Review = model("Review", reviewSchema);

export default Review;
```

Puntos clave:
- `rating` va de 1 a 5 — la UI mostrara estrellas.
- El indice compuesto garantiza una sola review por email+producto. Si intentas crear dos, el error handler devolvera 409 (E11000).
- El `email` del visitante se guarda para posibles boletines futuros, pero no verifica que exista.

### Tarea 3 — Script de prueba para los 3 modelos (~1h)

Crea un archivo temporal `api/test-models.js` para verificar que los modelos funcionan:

```js
import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.model.js";
import Product from "./models/Product.model.js";
import Review from "./models/Review.model.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/retail-catalog-dev";

async function testModels() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB\n");

    // Limpiar datos previos
    await Review.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // 1. Crear un usuario
    const admin = await User.create({
      name: "Admin Test",
      email: "admin@test.com",
      password: "password123",
    });
    console.log("User created:", admin.name);

    // 2. Crear un producto con categorias y barcode
    const product = await Product.create({
      name: "Camiseta Basica",
      description: "Camiseta de algodon 100%",
      price: 19.99,
      stock: 25,
      categories: ["Ropa"],
      barcode: "1234567890123",
      owner: admin._id,
    });
    console.log("Product created:", product.name);

    // 3. Crear una review
    const review = await Review.create({
      email: "visitante@test.com",
      rating: 4,
      product: product._id,
    });
    console.log("Review created:", review.rating, "stars");

    // 4. Probar populate directo (Product -> owner)
    const populatedProduct = await Product.findById(product._id)
      .populate("owner", "name email");
    console.log("\n--- Product con populate owner ---");
    console.log(JSON.stringify(populatedProduct, null, 2));

    // 5. Probar virtual populate (Product -> reviews)
    const productWithReviews = await Product.findById(product._id)
      .populate("reviews");
    console.log("\n--- Product con virtual populate reviews ---");
    console.log(JSON.stringify(productWithReviews, null, 2));

    // 6. Probar indice compuesto (no puede haber dos reviews del mismo email+producto)
    try {
      await Review.create({
        email: "visitante@test.com",
        rating: 5,
        product: product._id,
      });
      console.log("ERROR: deberia haber fallado!");
    } catch (err) {
      console.log("\nDuplicate review rejected (expected):", err.code === 11000 ? "E11000 OK" : err.message);
    }

    // Limpiar
    await Review.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log("\nTest data cleaned up");
  } finally {
    await mongoose.connection.close();
  }
}

testModels();
```

Ejecuta:
```bash
node test-models.js
```

Verifica:
1. El producto tiene `categories: ["Ropa"]` y `barcode` en el JSON.
2. El virtual populate de reviews muestra las valoraciones.
3. Intentar una segunda review del mismo email+producto lanza E11000.
4. Ningun JSON muestra `_id` ni `__v`.

Cuando termines, **borra `test-models.js`**.

### Tarea 4 — Probar validaciones (~30min)

Prueba estos casos en el script antes de borrarlo:

1. **Categoria invalida** → `categories: ["Videojuegos"]` → error "Videojuegos is not a valid category"
2. **Rating fuera de rango** → `rating: 6` → error "Rating cannot exceed 5"
3. **Barcode duplicado** → crear dos productos con el mismo barcode → E11000
4. **Producto con multiples categorias** → `categories: ["Ropa", "Deportes"]` → deberia funcionar

```js
// Ejemplo: categoria invalida
try {
  await Product.create({
    name: "Test",
    price: 10,
    stock: 5,
    categories: ["Videojuegos"],
    owner: admin._id,
  });
} catch (err) {
  console.log("Expected error:", err.message);
}
```

### Tarea 5 — Revision final (~15min)

Abre los 3 archivos de modelos y comprueba que siguen el mismo patron:
- Mismo formato de opciones del schema (`timestamps`, `versionKey`, `toJSON`)
- Misma estructura (imports, schema, opciones, virtuals/indexes, model, export)
- Nombres consistentes

---

## Refuerzo (~30min)

- Abre MongoDB Compass y mira las colecciones `users` y `products`. En un producto, observa que `categories` es un array de strings y que `owner` es un ObjectId.
- Crea un segundo producto sin barcode y otro con el mismo barcode que el primero → el duplicado deberia fallar.
- Piensa: si un visitante quiere dejar 3 reviews en 3 productos distintos, puede? Y si quiere dejar 2 reviews en el mismo producto, puede?

---

## Checklist

- [ ] `Product.model.js` creado con: name, description, price, images (max 3), stock, categories (enum), barcode (optional, unique, sparse), owner (ref User)
- [ ] Product tiene virtual populate `reviews`
- [ ] Product tiene toJSON con transform (elimina _id) y virtuals: true
- [ ] `Review.model.js` creado con: email, rating (1-5), product (ref)
- [ ] Review tiene indice compuesto `{ email, product }` con unique: true
- [ ] Review tiene toJSON con transform (elimina _id) y virtuals: true
- [ ] Categoria invalida en Product lanza ValidationError
- [ ] Rating fuera de rango en Review lanza ValidationError
- [ ] Segunda review del mismo email+producto lanza E11000
- [ ] Producto con multiples categorias funciona
- [ ] Virtual populate Product -> reviews funciona
- [ ] Populate directo Product -> owner funciona (sin password)
- [ ] Scripts de test borrados
