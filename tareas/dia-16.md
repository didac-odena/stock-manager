# Dia 16 — Layout admin + listado de productos + perfil

> Objetivo: crear el layout del panel de administracion (navegacion lateral), proteger las rutas de admin, implementar el listado de productos con tabla y acciones, y la pagina de perfil del administrador.

---

## Estudio (~1h)

### Layout admin vs layout publico

El panel de admin tiene una navegacion diferente: un sidebar o barra lateral con enlaces a las secciones de administracion (Productos, Perfil).

Usamos otro layout con `<Outlet />`, igual que el publico:

```jsx
function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside>Sidebar</aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
```

### Proteger rutas privadas — el patron PrivateRoute

Las rutas de admin solo deben ser accesibles para usuarios logueados. El patron PrivateRoute es un componente que actua como "portero":

```jsx
function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
}
```

En el router, lo usamos como wrapper del AdminLayout:
```jsx
<Route element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
  <Route path="/admin/products" element={<AdminProductsPage />} />
  ...
</Route>
```

Cuando React intenta renderizar cualquier ruta dentro de este bloque:
1. Renderiza `PrivateRoute` y llama a `useAuth()`.
2. Si `user` es `null` → redirige a `/login` sin renderizar `AdminLayout` ni la pagina.
3. Si `user` existe → renderiza `children` (que es `AdminLayout`) con el `Outlet` correspondiente.

**Por que envolvemos AdminLayout y no cada ruta individualmente:** si lo pusieramos en cada ruta, tendriamos que repetirlo 4 veces. Envolviendo el Route padre, una sola comprobacion protege todas las rutas hijas.

**Atencion al loading del AuthContext**: si `user` es `null` mientras el AuthContext esta comprobando la sesion, `PrivateRoute` redirigira a login incorrectamente. Por eso el AuthContext muestra un spinner mientras `loading === true`, antes de que se renderice el `Router` y el `PrivateRoute`.

### Tabla de productos admin vs catalogo publico

El catalogo publico muestra tarjetas visuales. El admin muestra una tabla con datos de gestion:

| Imagen | Nombre | Categorias | Stock | Precio | Acciones |
|--------|--------|------------|-------|--------|----------|
| img    | Camisa | Ropa       | 15    | 25 EUR | Editar / Eliminar |

Diferencias clave:
- El admin VE la cantidad de stock exacta (no solo disponible/agotado).
- El admin tiene botones de accion (editar, eliminar).
- Hay un boton para crear producto nuevo.

### Confirmacion antes de acciones destructivas

Antes de borrar un producto, mostramos un dialogo de confirmacion:

```jsx
async function handleDelete(id) {
  if (!window.confirm("Seguro que quieres eliminar este producto?")) return;
  await deleteProduct(id);
  fetchProducts(page);
}
```

`window.confirm()` es la forma mas simple — detiene la ejecucion hasta que el usuario acepta o cancela. Para produccion real se usaria un modal personalizado, pero para el proyecto es suficiente.

### Paginacion en el admin

Para el admin, usamos `useState` simple en vez de `searchParams`. La diferencia:
- Catalogo publico → `useSearchParams` (la URL es compartible, el boton "atras" funciona con los filtros)
- Panel admin → `useState` (no necesitamos compartir la URL de la pagina de administracion, el estado es efimero)

---

## Tareas (~4h)

### Tarea 1 — Crear componente PrivateRoute (~15min)

Crea `web/src/components/PrivateRoute.jsx`:

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/auth.context";

function PrivateRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default PrivateRoute;
```

### Tarea 2 — Crear AdminLayout (~30min)

Crea `web/src/components/layout/AdminLayout.jsx`:

```jsx
import { Outlet, NavLink, Link } from "react-router-dom";
import { useAuth } from "../../contexts/auth.context";

function AdminLayout() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  const linkClasses = ({ isActive }) =>
    `block px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-700 font-semibold"
        : "text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <Link to="/" className="text-xl font-bold text-gray-900 mb-8 px-4">
          Retail Catalog
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          <NavLink to="/admin/products" className={linkClasses}>
            Productos
          </NavLink>
          <NavLink to="/admin/profile" className={linkClasses}>
            Perfil
          </NavLink>
        </nav>

        <div className="border-t pt-4 px-4">
          <p className="text-sm text-gray-500 mb-2">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 bg-gray-50 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
```

### Tarea 3 — Actualizar App.jsx con layout admin y rutas protegidas (~20min)

Actualiza `web/src/App.jsx`:

```jsx
import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./components/layout/PublicLayout";
import AdminLayout from "./components/layout/AdminLayout";
import PrivateRoute from "./components/PrivateRoute";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminProductFormPage from "./pages/AdminProductFormPage";
import AdminProfilePage from "./pages/AdminProfilePage";

function App() {
  return (
    <Routes>
      {/* Rutas publicas */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<CatalogPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Rutas admin (protegidas) */}
      <Route element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/products/new" element={<AdminProductFormPage />} />
        <Route path="/admin/products/:id/edit" element={<AdminProductFormPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// Nota: la ruta /admin/barcode y AdminBarcodePage se añaden en el dia 18.

export default App;
```

### Tarea 4 — Implementar AdminProductsPage (~1.5h)

Actualiza `web/src/pages/AdminProductsPage.jsx`:

```jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts, deleteProduct } from "../services/products.service";

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function fetchProducts(pageNum) {
    setLoading(true);
    getProducts({ page: pageNum, limit: 10 })
      .then((response) => {
        setProducts(response.data);
        setMeta(response.meta);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  async function handleDelete(id) {
    if (!window.confirm("Seguro que quieres eliminar este producto?")) return;

    try {
      setError("");
      await deleteProduct(id);
      fetchProducts(page);
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar producto");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Productos {meta && `(${meta.total})`}
        </h1>
        <Link
          to="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Producto
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando productos...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No hay productos todavia</p>
          <Link
            to="/admin/products/new"
            className="text-blue-600 hover:underline"
          >
            Crear el primero
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Producto
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Categorias
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Stock
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Precio
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => {
                  const imageUrl = product.images.length > 0
                    ? product.images[0]
                    : "/placeholder-product.png";

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <span className="font-medium text-gray-900">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.categories.join(", ") || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            product.stock === 0
                              ? "text-red-500"
                              : product.stock < 5
                              ? "text-yellow-600"
                              : "text-gray-900"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {product.price.toFixed(2)} EUR
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginacion */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-gray-600 text-sm">
                Pagina {meta.page} de {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminProductsPage;
```

### Tarea 5 — Probar el listado admin (~30min)

1. Navega a `/admin/products` (logueado).
2. Verifica:
   - Tabla muestra productos con imagen, nombre, categorias, stock, precio.
   - Stock 0 se muestra en rojo.
   - Stock bajo (< 5) en amarillo.
   - Boton "+ Producto" visible (llevara a la pagina de crear, que haremos manana).
   - Total de productos en el titulo.
3. Prueba la navegacion del sidebar:
   - Clic en Productos, Perfil → cambia la pagina.
   - El enlace activo se resalta.
   - Clic en "Retail Catalog" → vuelve a la home publica.
4. Prueba eliminar un producto:
   - Cancelar no borra, Aceptar si.
   - La lista se refresca.

### Tarea 6 — Pagina de perfil admin (~30min)

Actualiza `web/src/pages/AdminProfilePage.jsx`:

```jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/auth.context";
import { updateProfile } from "../services/auth.service";

function AdminProfilePage() {
  const { user } = useAuth();
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
    },
  });

  async function onSubmit(data) {
    try {
      setApiError("");
      setSuccess(false);
      await updateProfile(data);
      setSuccess(true);
    } catch (error) {
      setApiError(error.response?.data?.message || "Error al actualizar perfil");
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>

      <div className="mb-6">
        <p className="text-sm text-gray-500">Email</p>
        <p className="text-gray-900">{user?.email}</p>
      </div>

      {apiError && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {apiError}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">
          Perfil actualizado correctamente
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

export default AdminProfilePage;
```

### Tarea 7 — Probar perfil admin (~10min)

1. Ve a `/admin/profile`.
2. Cambia el nombre → Guardar → mensaje de exito.
3. El email se muestra pero no se puede editar.

---

## Refuerzo (~30min)

- Prueba a acceder a `/admin/products` sin estar logueado → debe redirigir a `/login`.
- Comprueba que los productos eliminados desde el admin ya no aparecen en el catalogo publico.
- Si ves algun detalle visual que mejorar, aprovecha.

---

## Checklist

- [ ] PrivateRoute componente creado (redirige a /login si no hay user)
- [ ] AdminLayout con sidebar y Outlet
- [ ] Sidebar con enlaces a Productos y Perfil (sin Categorias)
- [ ] Sidebar muestra nombre del usuario y boton logout
- [ ] Enlace activo resaltado en el sidebar
- [ ] App.jsx actualizado con rutas admin protegidas (sin AdminBarcodePage — se añade en dia 18)
- [ ] AdminProductsPage con tabla de productos
- [ ] Tabla muestra: imagen, nombre, categorias, stock, precio, acciones
- [ ] Categorias en tabla como texto separado por comas
- [ ] Stock coloreado segun nivel (rojo 0, amarillo < 5, normal resto)
- [ ] Boton "+ Producto" enlaza a /admin/products/new
- [ ] Boton "Editar" enlaza a /admin/products/:id/edit
- [ ] Eliminar con confirmacion funciona
- [ ] Lista se refresca tras eliminar
- [ ] Total de productos en el titulo
- [ ] Paginacion funciona si hay mas de 10 productos
- [ ] Estado vacio muestra mensaje con enlace a crear
- [ ] Acceder sin auth redirige a /login
- [ ] AdminProfilePage muestra email (no editable) y formulario para nombre
- [ ] Editar nombre en perfil funciona (mensaje de exito)
