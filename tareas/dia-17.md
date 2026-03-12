# Dia 17 — Formulario crear/editar producto (imagenes + categorias + barcode)

> Objetivo: implementar el formulario de productos con React Hook Form, seleccion multiple de categorias mediante checkboxes, campo de codigo de barras opcional, subida de imagenes con FormData, y modo crear/editar compartido en un solo componente.

---

## Estudio (~45min)

### FormData — enviar archivos desde el frontend

Para enviar archivos (imagenes), no podemos usar JSON. Usamos `FormData`, que construye un cuerpo `multipart/form-data`:

```js
const formData = new FormData();
formData.append("name", "Camiseta");
formData.append("price", "19.99");
formData.append("images", file1);  // archivo del input
formData.append("images", file2);  // otro archivo
```

Axios envia FormData automaticamente con el Content-Type correcto:
```js
await http.post("/products", formData);
// Axios detecta FormData y pone Content-Type: multipart/form-data
```

### Arrays en FormData

`categories` es un array de strings en el modelo. Con FormData no puedes poner un array directamente: hay que llamar `append` una vez por cada valor:

```js
// Correcto — una llamada por elemento
selectedCategories.forEach((cat) => {
  formData.append("categories", cat);
});

// Incorrecto — envia el string "[Ropa,Deportes]"
formData.append("categories", selectedCategories);
```

### Checkboxes para seleccion multiple

En lugar de un `<select>`, usamos checkboxes para que el usuario pueda marcar varias categorias:

```jsx
const [selectedCategories, setSelectedCategories] = useState([]);

function handleCategoryChange(category) {
  setSelectedCategories((prev) =>
    prev.includes(category)
      ? prev.filter((c) => c !== category)
      : [...prev, category]
  );
}

// En el JSX
{CATEGORIES.map((cat) => (
  <label key={cat}>
    <input
      type="checkbox"
      checked={selectedCategories.includes(cat)}
      onChange={() => handleCategoryChange(cat)}
    />
    {cat}
  </label>
))}
```

### Formulario compartido para crear y editar

El mismo componente `AdminProductFormPage` sirve para crear y editar. La diferencia:
- **Crear**: no hay `:id` en la URL, el formulario empieza vacio.
- **Editar**: hay `:id`, se cargan los datos del producto y se pre-rellenan los campos.

```jsx
const { id } = useParams();
const isEditing = Boolean(id);
```

### Preview de imagenes seleccionadas

Para mostrar una preview de las imagenes antes de subirlas:
```js
const previewUrl = URL.createObjectURL(file);
// Usar como src de un <img>
```

`URL.createObjectURL(file)` crea una URL temporal del tipo `blob:http://localhost:5173/...` que apunta al archivo en memoria del navegador. El archivo nunca se sube a ningún sitio — es solo para la preview visual.

**Nota sobre memoria**: estas URLs temporales consumen memoria del navegador. En produccion conviene liberarlas con `URL.revokeObjectURL(url)` cuando ya no se necesitan. Para este proyecto no es un problema porque la pagina se recarga al guardar, pero es bueno saberlo para el futuro.

### Por que FormData en vez de JSON

Los servicios de productos usan `FormData` (no `JSON`) porque necesitan enviar archivos. `Content-Type: application/json` solo puede transportar texto. `multipart/form-data` puede mezclar texto y binarios.

Axios detecta automaticamente si el body es un `FormData` y pone el `Content-Type` correcto:
```js
// No necesitas poner headers manualmente
await http.post("/products", formData);  // Axios pone Content-Type: multipart/form-data
```

---

## Tareas (~4h)

### Tarea 1 — Verificar funciones en el servicio de productos (~5min)

`createProduct` y `updateProduct` ya estan en `web/src/services/products.service.js` desde el dia 11. Abrete el archivo y confirma que las dos funciones estan ahi antes de continuar:

```js
export function createProduct(formData) {
  return http.post("/products", formData);
}

export function updateProduct(id, formData) {
  return http.patch(`/products/${id}`, formData);
}
```

Si por algun motivo no estan, añadelas. En cualquier caso, no necesitas configurar headers — Axios detecta `FormData` automaticamente.

### Tarea 2 — Implementar AdminProductFormPage (~2h)

Actualiza `web/src/pages/AdminProductFormPage.jsx`:

```jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { getProduct, createProduct, updateProduct } from "../services/products.service";
import { getCategories } from "../services/categories.service";

function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Cargar categorias disponibles
  useEffect(() => {
    getCategories().then(setAvailableCategories).catch(console.error);
  }, []);

  // Si estamos editando, cargar el producto
  useEffect(() => {
    if (isEditing) {
      getProduct(id)
        .then((product) => {
          reset({
            name: product.name,
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            barcode: product.barcode || "",
          });
          setSelectedCategories(product.categories || []);
          setCurrentImages(product.images || []);
        })
        .catch(() => navigate("/admin/products"));
    }
  }, [id, isEditing, reset, navigate]);

  function handleCategoryChange(category) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      setApiError("Maximo 3 imagenes");
      return;
    }
    setSelectedFiles(files);
  }

  async function onSubmit(data) {
    try {
      setApiError("");

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("price", data.price);
      formData.append("stock", data.stock);

      if (data.barcode) {
        formData.append("barcode", data.barcode);
      }

      // Categorias: una llamada append por elemento
      selectedCategories.forEach((cat) => {
        formData.append("categories", cat);
      });

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      if (isEditing) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }

      navigate("/admin/products");
    } catch (error) {
      setApiError(error.response?.data?.message || "Error al guardar producto");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? "Editar producto" : "Crear producto"}
      </h1>

      {apiError && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("name", { required: "El nombre es obligatorio" })}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Descripcion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripcion
          </label>
          <textarea
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("description")}
          />
        </div>

        {/* Precio y Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("price", {
                required: "El precio es obligatorio",
                min: { value: 0, message: "El precio no puede ser negativo" },
              })}
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock
            </label>
            <input
              type="number"
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("stock", {
                required: "El stock es obligatorio",
                min: { value: 0, message: "El stock no puede ser negativo" },
              })}
            />
            {errors.stock && (
              <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
            )}
          </div>
        </div>

        {/* Barcode (opcional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Codigo de barras <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 1234567890123"
            {...register("barcode")}
          />
        </div>

        {/* Categorias (checkboxes) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categorias
          </label>
          <div className="flex flex-wrap gap-3">
            {availableCategories.map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => handleCategoryChange(cat)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Imagenes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imagenes (max. 3)
          </label>

          {/* Imagenes actuales (solo en edicion) */}
          {isEditing && currentImages.length > 0 && (
            <div className="flex gap-2 mb-2">
              {currentImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Actual ${index + 1}`}
                  className="w-20 h-20 rounded object-cover border"
                />
              ))}
              <p className="text-xs text-gray-500 self-end">
                (se reemplazaran si subes nuevas)
              </p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {/* Preview de archivos seleccionados */}
          {selectedFiles.length > 0 && (
            <div className="flex gap-2 mt-2">
              {selectedFiles.map((file, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 rounded object-cover border"
                />
              ))}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminProductFormPage;
```

### Tarea 3 — Probar crear producto (~30min)

1. Ve a `/admin/products` → clic en "+ Producto".
2. Rellena todos los campos.
3. Selecciona una o varias categorias con los checkboxes.
4. Opcionalmente escribe un codigo de barras.
5. Selecciona imagenes → verifica que aparecen las previews.
6. Guardar → redirige a la lista con el producto nuevo.
7. Verifica en el catalogo publico que aparece.

**Validaciones:**
- Enviar sin nombre → error inline.
- Seleccionar mas de 3 imagenes → error.
- Crear producto con barcode duplicado → error del backend.

### Tarea 4 — Probar editar producto (~30min)

1. En la lista admin, clic en "Editar" en un producto.
2. Los campos se pre-rellenan (nombre, descripcion, precio, stock, barcode).
3. Los checkboxes de categorias reflejan las categorias actuales del producto.
4. Las imagenes actuales se muestran como miniaturas.
5. Modifica algo → Guardar → vuelve a la lista con los cambios.
6. Sube nuevas imagenes → las anteriores se reemplazan.

### Tarea 5 — Probar flujo completo frontend (~30min)

Recorre toda la app como un visitante y como un admin:

**Visitante:**
1. Home → categorias + productos destacados.
2. Clic en categoria → catalogo filtrado.
3. Buscar por nombre → resultados filtrados.
4. Clic en producto → detalle con galeria y reviews.
5. Volver al catalogo → filtros se mantienen.

**Admin:**
1. Login → llega a /admin/products.
2. Crear producto (con categorias y barcode) → aparece en la tabla.
3. Editar producto → campos pre-rellenados, guardar funciona.
4. Eliminar producto → desaparece.
5. Perfil → editar nombre.
6. Logout → vuelve a la web publica.
7. Los productos creados/editados aparecen en el catalogo publico.

---

## Refuerzo (~30min)

- Prueba a crear un producto sin imagenes → deberia funcionar (las imagenes son opcionales).
- Prueba a editar un producto y no subir imagenes nuevas → las actuales se mantienen.
- Revisa en DevTools → Network que el POST/PATCH envia `multipart/form-data` (no JSON).
- Verifica que las categorias del producto nuevo aparecen correctamente en el catalogo y en la pagina de detalle.

---

## Checklist

- [ ] createProduct y updateProduct en el servicio de productos
- [ ] Formulario con checkboxes para seleccionar multiples categorias
- [ ] Campo barcode opcional en el formulario
- [ ] Formulario crear producto funciona (con imagenes)
- [ ] Formulario editar producto funciona (pre-rellena datos, categorias y barcode)
- [ ] Checkboxes de categorias se pre-marcan en modo edicion
- [ ] Validaciones inline (required, min)
- [ ] Preview de imagenes seleccionadas antes de subir
- [ ] Maximo 3 imagenes (error si se seleccionan mas)
- [ ] Imagenes actuales visibles en modo edicion
- [ ] categories se envia como multiples valores en FormData (no como string)
- [ ] Boton Cancelar vuelve a la lista
- [ ] Boton Guardar deshabilitado mientras se envia
- [ ] Flujo visitante completo funciona (home → catalogo → detalle)
- [ ] Flujo admin completo funciona (login → productos → perfil → logout)
