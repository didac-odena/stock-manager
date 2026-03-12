# Dia 2 — Modelo User (bcrypt, hooks, transforms, virtual)

> Objetivo: crear el modelo User completo con hasheo de password, metodo checkPassword, transformacion toJSON y virtual populate de productos. Es el modelo mas complejo del proyecto, asi que hoy nos centramos solo en el.

---

## Estudio (~1.5h)

### Schemas y modelos en Mongoose — repaso rapido

Un Schema define la forma de los datos (campos, tipos, validaciones). Un Model es la herramienta para hacer CRUD sobre esa forma.

```js
import { Schema, model } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

const User = model("User", userSchema);
export default User;
```

Reglas de nombres:
- Modelo en singular y PascalCase: `User`
- Mongoose crea la coleccion en plural y minusculas: `users`
- El archivo se llama `User.model.js`

### Opciones del schema: timestamps y versionKey

```js
const userSchema = new Schema(
  { /* campos */ },
  { timestamps: true, versionKey: false }
);
```

- `timestamps: true` — Mongoose anade automaticamente `createdAt` y `updatedAt`.
- `versionKey: false` — elimina el campo `__v` que Mongoose crea por defecto (no lo necesitamos).

### Validaciones en el schema

Los validadores se ponen directamente en la definicion del campo:

```js
name: {
  type: String,
  required: [true, "El nombre es obligatorio"],  // mensaje de error personalizado
  trim: true                                      // elimina espacios al inicio y final
}
```

Validadores mas comunes:
- `required` — campo obligatorio
- `unique` — no puede repetirse (ojo: esto es un indice, no un validador de Mongoose)
- `trim` — elimina espacios
- `lowercase` — convierte a minusculas antes de guardar
- `minlength` / `maxlength` — longitud de strings
- `min` / `max` — valor minimo/maximo para numeros
- `enum` — lista de valores permitidos
- `default` — valor si no se envia el campo

### Transformacion toJSON

Cuando Express envia un documento como JSON (`res.json(user)`), Mongoose llama internamente al metodo `toJSON()`. Podemos personalizarlo con un transform:

```js
const userSchema = new Schema(
  { /* campos */ },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,       // incluir campos virtuales en el JSON
      transform: (_doc, ret) => {
        delete ret._id;      // quitamos _id (Mongoose ya expone `id` como virtual)
        delete ret.password;  // NUNCA devolver el password, ni siquiera el hash
      },
    },
  }
);
```

Que pasa aqui:
- `virtuals: true` — necesario para que `id` (y nuestros virtual populates) aparezcan en el JSON.
- `transform` — funcion que recibe el documento original (`_doc`) y el objeto a devolver (`ret`). Podemos borrar o modificar campos de `ret`.
- `delete ret._id` — eliminamos el `_id` de MongoDB. Mongoose ya expone un campo virtual `id` (sin guion bajo) que es mas limpio.
- `delete ret.password` — seguridad: nunca exponer el hash del password.

### bcrypt — por que y como

Guardar passwords en texto plano es un fallo critico de seguridad. Si alguien accede a la base de datos, tiene todas las contrasenas.

bcrypt resuelve esto:
1. Genera un **salt** (cadena aleatoria unica para cada password).
2. Aplica una funcion de **hash** irreversible combinando el salt con el password.
3. El resultado es un string tipo `"$2b$10$Ks3x..."` que no se puede revertir.

```
"miPassword123"  -->  bcrypt.hash()  -->  "$2b$10$Ks3x..."  (no reversible)
```

Para verificar en el login: bcrypt extrae el salt del hash almacenado, hashea el password que envio el usuario y compara los dos hashes.

```js
import bcrypt from "bcrypt";

// Hashear (registro)
const hash = await bcrypt.hash("miPassword123", 10);  // 10 = salt rounds

// Comparar (login)
const esCorrecta = await bcrypt.compare("miPassword123", hash);  // true o false
```

`SALT_ROUNDS = 10` significa 2^10 iteraciones. Es el valor estandar. Mas alto = mas seguro pero mas lento.

### Pre-save hook — hasheo automatico

Un middleware `pre('save')` se ejecuta ANTES de guardar el documento en la base de datos. Es el lugar ideal para hashear el password automaticamente:

```js
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});
```

Puntos clave:
- **`function` en vez de arrow function** — necesitamos `this` para acceder al documento que se esta guardando. Las arrow functions no tienen su propio `this`.
- **`this.isModified("password")`** — solo hashea si el campo password ha cambiado. Si el admin actualiza su nombre, no queremos re-hashear el password existente.
- Se dispara con `.save()` y con `Model.create()` (que internamente llama a `.save()`).
- NO se dispara con `findByIdAndUpdate()`. Por eso, para actualizar usuarios usaremos `Object.assign(doc, body) + doc.save()`.

### Metodo de instancia — checkPassword

Un metodo de instancia es una funcion que puedes llamar sobre un documento individual:

```js
userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};
```

Uso en el login:
```js
const user = await User.findOne({ email });
const isValid = await user.checkPassword("miPassword123");  // true o false
```

### Virtual populate (relacion inversa)

En nuestro proyecto, un User tiene muchos Products (1:N). En vez de guardar un array de IDs de productos en el User, usamos un virtual:

```js
userSchema.virtual("products", {
  ref: "Product",       // modelo al que apunta
  localField: "_id",    // campo de User que se usa para la relacion
  foreignField: "owner" // campo de Product que guarda la referencia al User
});
```

Ventajas:
- No guardamos nada extra en la coleccion `users`.
- Mongoose calcula la relacion al vuelo cuando hacemos `.populate("products")`.
- El array `products` solo aparece si lo pedimos con populate, no ocupa espacio en la DB.

Para que funcione en el JSON, necesitas `virtuals: true` en las opciones `toJSON` del schema.

---

## Tareas (~3h)

### Tarea 1 — Instalar bcrypt (~5min)

```bash
cd api
npm install bcrypt
```

Si te da problemas de compilacion nativa, usa `bcryptjs` como alternativa:
```bash
npm install bcryptjs
```
(El API es identico, solo cambia el import: `import bcrypt from "bcryptjs"`)

### Tarea 2 — Crear el modelo User (~45min)

Crea `api/models/User.model.js`:

```js
import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    avatar: {
      type: String,
      default: "https://res.cloudinary.com/demo/image/upload/d_avatar.png",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.password;
      },
    },
  }
);

// Pre-save hook: hashear password antes de guardar
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  }
});

// Metodo de instancia: comparar password en el login
userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Virtual populate: obtener los productos creados por este usuario
userSchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "owner",
});

const User = model("User", userSchema);

export default User;
```

### Tarea 3 — Verificar el modelo en consola (~30min)

Vamos a probar que el modelo funciona correctamente creando un usuario temporal desde un script.

Crea un archivo temporal `api/test-user.js`:

```js
import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.model.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/retail-catalog-dev";

async function testUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    // 1. Crear usuario
    const user = await User.create({
      name: "Test Admin",
      email: "test@test.com",
      password: "password123",
    });

    console.log("\n--- Usuario creado (toJSON) ---");
    console.log(JSON.stringify(user, null, 2));
    // Deberia mostrar: id, name, email, avatar, createdAt, updatedAt
    // NO deberia mostrar: _id, password, __v

    // 2. Verificar que el password esta hasheado en la DB
    const rawUser = await User.findOne({ email: "test@test.com" });
    console.log("\n--- Password en la DB (hasheado) ---");
    console.log(rawUser.password);
    // Deberia ser algo como: $2b$10$Ks3x...

    // 3. Probar checkPassword
    const isValid = await rawUser.checkPassword("password123");
    const isInvalid = await rawUser.checkPassword("wrongpassword");
    console.log("\n--- checkPassword ---");
    console.log("password123 →", isValid);       // true
    console.log("wrongpassword →", isInvalid);    // false

    // 4. Limpiar
    await User.deleteMany({});
    console.log("\nTest data cleaned up");
  } finally {
    await mongoose.connection.close();
  }
}

testUser();
```

Ejecuta:
```bash
node test-user.js
```

Verifica:
1. El JSON del usuario NO muestra `_id` ni `password`.
2. El password en la DB empieza por `$2b$10$...`.
3. `checkPassword` devuelve `true` con el password correcto y `false` con uno incorrecto.

Cuando estes satisfecho, **borra `test-user.js`** — era solo para verificar.

### Tarea 4 — Probar el unique de email (~15min)

Antes de borrar el script de test, prueba esto: ejecuta `node test-user.js` DOS VECES seguidas sin limpiar la DB entre medias. La segunda vez deberia dar un error de duplicado (E11000) porque el email ya existe.

Si funciona, el indice `unique` esta bien configurado.

Nota: si quieres reiniciar, puedes borrar la coleccion desde MongoDB Compass o anadiendo `await User.deleteMany({})` al principio del script.

### Tarea 5 — Revisar campo a campo (~30min)

Abre `User.model.js` y repasa cada linea. Asegurate de que puedes explicar:

1. Por que `email` tiene `lowercase: true` y `trim: true`.
2. Por que `password` tiene `minlength: 8` — y entiende que esta validacion se aplica al password EN TEXTO PLANO (antes del hash), porque el hook `pre('save')` se ejecuta DESPUES de la validacion.
3. Que pasa si haces `user.name = "Nuevo nombre"; await user.save();` — se re-hashea el password?
4. Por que usamos `function` y no `() =>` en el pre-save hook.
5. Que hace `delete ret._id` en el toJSON transform.

---

## Refuerzo (~30min)

- Abre MongoDB Compass y mira la coleccion `users`. Observa como se guarda el documento realmente (con `_id`, con el hash del password, con los timestamps).
- Compara lo que ves en Compass (documento real) con lo que sale por `console.log(JSON.stringify(user))` (documento transformado por toJSON). Esa diferencia es el efecto del transform.
- Si tienes dudas sobre el virtual `products`, no te preocupes — lo veremos en accion cuando creemos el modelo Product manana.

---

## Checklist

- [ ] bcrypt instalado
- [ ] Archivo `User.model.js` creado en `api/models/`
- [ ] Schema con los 4 campos: name, email, password, avatar
- [ ] Opciones del schema: timestamps, versionKey false, toJSON con transform
- [ ] toJSON elimina `_id` y `password` del JSON
- [ ] Pre-save hook que hashea el password (con guarda isModified)
- [ ] Metodo checkPassword que compara con bcrypt.compare
- [ ] Virtual populate `products` configurado
- [ ] Test manual: el password se guarda hasheado (empieza por $2b$10$)
- [ ] Test manual: toJSON no muestra _id ni password
- [ ] Test manual: checkPassword devuelve true/false correctamente
- [ ] Test manual: email duplicado lanza error E11000
- [ ] Script de test borrado
