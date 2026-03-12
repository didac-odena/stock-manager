# Dia 10 — Setup frontend: Vite + Tailwind + React Router + layout publico

> Objetivo: tener la app React arrancada con Tailwind CSS, React Router configurado con todas las rutas (vacias por ahora), y un layout publico con navbar y footer visibles. Solo estructura, nada de logica.

---

## Estudio (~1h)

### Vite + React SWC

Vite es un bundler ultrarapido para desarrollo. SWC es un compilador que reemplaza a Babel y es mucho mas rapido. Juntos hacen que los cambios se reflejen en el navegador casi al instante.

```bash
npm create vite@latest web -- --template react-swc
```

Esto crea la carpeta `web/` con la estructura basica de un proyecto React.

### Tailwind CSS

Tailwind es un framework CSS de utilidades. En vez de crear clases CSS, usas clases directamente en el HTML:

```jsx
// CSS tradicional
<div className="product-card">

// Tailwind
<div className="bg-white rounded-lg shadow p-4">
```

Cada clase aplica UNA propiedad CSS:
- `bg-white` → `background-color: white`
- `rounded-lg` → `border-radius: 0.5rem`
- `shadow` → `box-shadow: ...`
- `p-4` → `padding: 1rem`

Para instalar Tailwind con Vite seguiremos la guia oficial (vite + tailwind v4).

### React Router v6 — estructura basica

React Router sincroniza la URL del navegador con el componente que se muestra.

**Conceptos clave:**

1. `BrowserRouter` — envuelve toda la app. Controla el historial del navegador.
2. `Routes` — contenedor donde defines las rutas.
3. `Route` — cada ruta individual (`path` + `element`).
4. `Link` — navegacion sin recargar la pagina (reemplaza a `<a>`).
5. `NavLink` — como Link pero con clase activa automatica.
6. `Navigate` — redireccion programatica como componente.
7. `Outlet` — placeholder para rutas anidadas (lo usaremos para layouts).

```jsx
// App.jsx
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<CatalogPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
```

### Layouts con Outlet

Un layout es un componente que envuelve a otras paginas. Usa `<Outlet />` como placeholder donde se renderiza la pagina hija:

```jsx
// PublicLayout.jsx
function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />   {/* Aqui se renderiza la pagina actual */}
      </main>
      <Footer />
    </>
  );
}

// App.jsx
<Routes>
  <Route element={<PublicLayout />}>     {/* Layout sin path */}
    <Route path="/" element={<HomePage />} />
    <Route path="/products" element={<CatalogPage />} />
  </Route>
</Routes>
```

Las rutas dentro del layout comparten navbar y footer sin repetir codigo.

### Estructura de carpetas del frontend

```
web/src/
  components/
    layout/
      Navbar.jsx
      Footer.jsx
      PublicLayout.jsx
  pages/
    HomePage.jsx
    CatalogPage.jsx
    ProductDetailPage.jsx
    LoginPage.jsx
    RegisterPage.jsx
  contexts/       (vacio por ahora)
  services/       (vacio por ahora)
  App.jsx
  main.jsx
```

---

## Tareas (~3.5h)

### Tarea 1 — Crear el proyecto React (~15min)

Desde la raiz del proyecto (`final-project/`):

```bash
npm create vite@latest web -- --template react-swc
cd web
npm install
```

Abre `web/package.json` y verifica que tiene `"type": "module"`.

Limpia los archivos que no necesitas:
- Borra el contenido de `src/App.css`
- Borra `src/assets/` (o dejala vacia)
- Simplifica `src/App.jsx` a un componente vacio:

```jsx
function App() {
  return <div>App</div>;
}

export default App;
```

Prueba que arranca:
```bash
npm run dev
```
Deberia abrir en `http://localhost:5173` y mostrar "App".

### Tarea 2 — Instalar Tailwind CSS (~15min)

Sigue los pasos para Tailwind v4 con Vite:

```bash
npm install tailwindcss @tailwindcss/vite
```

Configura el plugin de Vite en `web/vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Reemplaza el contenido de `web/src/index.css` por:

```css
@import "tailwindcss";
```

Verifica que funciona: anade una clase de Tailwind en App.jsx:

```jsx
function App() {
  return <div className="text-3xl font-bold text-blue-600">Tailwind funciona!</div>;
}

export default App;
```

Si el texto sale grande, azul y negrita, Tailwind esta funcionando.

### Tarea 3 — Instalar React Router (~5min)

```bash
npm install react-router-dom
```

### Tarea 4 — Configurar BrowserRouter (~10min)

Actualiza `web/src/main.jsx`:

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

### Tarea 5 — Crear paginas placeholder (~20min)

Crea archivos placeholder para todas las paginas. Cada una solo muestra su nombre:

`web/src/pages/HomePage.jsx`:
```jsx
function HomePage() {
  return <div>Home Page</div>;
}

export default HomePage;
```

Repite para:
- `CatalogPage.jsx` — "Catalog Page"
- `ProductDetailPage.jsx` — "Product Detail Page"
- `LoginPage.jsx` — "Login Page"
- `RegisterPage.jsx` — "Register Page"
- `AdminProductsPage.jsx` — "Admin Products Page"
- `AdminProductFormPage.jsx` — "Admin Product Form Page"
- `AdminBarcodePage.jsx` — "Admin Barcode Page"
- `AdminProfilePage.jsx` — "Admin Profile Page"

> Nota: no creamos `AdminCategoriesPage.jsx`. Las categorias son una lista predefinida en el backend — no existe CRUD de categorias en el panel admin.

### Tarea 6 — Crear el Navbar (~30min)

Crea `web/src/components/layout/Navbar.jsx`:

```jsx
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Retail Catalog
          </Link>

          <div className="flex gap-4">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-900"
              }
            >
              Catalogo
            </NavLink>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-900"
              }
            >
              Login
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
```

### Tarea 7 — Crear el Footer (~10min)

Crea `web/src/components/layout/Footer.jsx`:

```jsx
function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
        Retail Catalog &copy; {new Date().getFullYear()}
      </div>
    </footer>
  );
}

export default Footer;
```

### Tarea 8 — Crear el PublicLayout (~15min)

Crea `web/src/components/layout/PublicLayout.jsx`:

```jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default PublicLayout;
```

`min-h-screen flex flex-col` + `flex-1` en main hace que el footer siempre quede abajo, incluso si el contenido es corto.

### Tarea 9 — Configurar todas las rutas en App.jsx (~30min)

Actualiza `web/src/App.jsx`:

```jsx
import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./components/layout/PublicLayout";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminProductFormPage from "./pages/AdminProductFormPage";
import AdminBarcodePage from "./pages/AdminBarcodePage";
import AdminProfilePage from "./pages/AdminProfilePage";

function App() {
  return (
    <Routes>
      {/* Rutas publicas con layout publico */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<CatalogPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Rutas admin (por ahora sin layout admin) */}
      <Route path="/admin/products" element={<AdminProductsPage />} />
      <Route path="/admin/products/new" element={<AdminProductFormPage />} />
      <Route path="/admin/products/:id/edit" element={<AdminProductFormPage />} />
      <Route path="/admin/barcode" element={<AdminBarcodePage />} />
      <Route path="/admin/profile" element={<AdminProfilePage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
```

### Tarea 10 — Probar la navegacion (~15min)

Arranca el frontend (`npm run dev`) y navega:
- `http://localhost:5173/` → muestra "Home Page" con navbar y footer
- `http://localhost:5173/products` → muestra "Catalog Page" con navbar y footer
- `http://localhost:5173/login` → muestra "Login Page" con navbar y footer
- `http://localhost:5173/admin/products` → muestra "Admin Products Page" (sin layout por ahora)
- `http://localhost:5173/admin/barcode` → muestra "Admin Barcode Page"
- `http://localhost:5173/ruta-que-no-existe` → redirige a Home

Los NavLinks del navbar deberian resaltarse cuando estas en esa ruta.

---

## Refuerzo (~30min)

- Prueba a navegar entre paginas y observa que la pagina NO se recarga (es una SPA).
- Abre la pestana Network del navegador — veras que no hay recargas de pagina completa.
- Experimenta con clases de Tailwind en algun componente para coger soltura.

---

## Checklist

- [ ] Proyecto React creado con Vite + SWC
- [ ] Tailwind CSS instalado y funcionando
- [ ] React Router instalado
- [ ] BrowserRouter en main.jsx
- [ ] 8 paginas placeholder creadas (sin AdminCategoriesPage)
- [ ] Navbar con Link y NavLink
- [ ] Footer con copyright
- [ ] PublicLayout con Outlet (navbar + main + footer)
- [ ] Todas las rutas definidas en App.jsx
- [ ] Rutas publicas usan PublicLayout
- [ ] Rutas admin definidas (sin layout por ahora)
- [ ] Fallback redirige a Home
- [ ] Navegacion funciona sin recargar pagina
- [ ] NavLinks se resaltan en la ruta activa
