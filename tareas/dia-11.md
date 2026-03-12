# Dia 11 — Servicios Axios + Contexto de autenticacion

> Objetivo: crear la capa de servicios (peticiones HTTP al backend) y el contexto de autenticacion que compartira el estado del usuario logueado con toda la app. Hoy es pura logica, sin UI nueva.

> **Nota importante**: Este dia es el primero en el que conectas frontend con backend, y es donde mas problemas suelen aparecer. El proxy de Vite puede no funcionar a la primera, las cookies pueden no enviarse, CORS puede dar errores crpticos... Es completamente normal. No te frustres si algo no funciona al primer intento. Lee los errores con calma, revisa la consola del navegador Y la terminal del backend, y ve paso a paso. Si te atascas mas de 30 minutos con un error, para y pregunta — no es que seas lento, es que esta parte es genuinamente complicada la primera vez.

---

## Estudio (~1.5h)

### El problema del prop drilling

Antes de hablar de Context, hay que entender el problema que resuelve.

Imaginemos que el usuario logueado (`user`) se necesita en el `Navbar`, en `AdminProductsPage` y en varias paginas del admin. Sin Context, tendriamos que pasar `user` como prop a traves de todos los niveles intermedios:

```
App (tiene el estado `user`)
  └── PublicLayout
        └── Navbar (necesita `user`)   ← hay que pasar user aqui
              └── ... (todos los intermedios)

App
  └── PrivateRoute (necesita `user` para comprobar si esta logueado)
        └── AdminLayout
              └── AdminProductsPage (podria necesitar `user`)
```

Este paso forzado de props a traves de componentes que no los necesitan se llama **prop drilling**. Con Context, cualquier componente puede acceder al estado global directamente sin que los intermedios lo toquen.

### Axios — cliente HTTP para React

Axios es una libreria para hacer peticiones HTTP. Es mas comodo que `fetch` porque:
- Convierte automaticamente las respuestas a JSON.
- Permite configurar una `baseURL` para no repetirla.
- Tiene interceptores para modificar peticiones/respuestas globalmente.

```js
import axios from "axios";

// Crear una instancia con config comun
const http = axios.create({
  baseURL: "/api",
  withCredentials: true,  // enviar cookies en cada peticion
});

// Peticion GET
const response = await http.get("/products");
// response.data contiene los datos
```

### Interceptores — simplificar respuestas

Cada respuesta de Axios viene envuelta en un objeto `{ data, status, headers, ... }`. Con un interceptor, podemos "desenvolverla" para que el llamador reciba directamente los datos:

```js
http.interceptors.response.use((response) => response.data);

// Ahora en vez de:
const response = await http.get("/products");
const products = response.data;

// Puedes hacer directamente:
const products = await http.get("/products");
```

### withCredentials — enviar cookies

Nuestro backend usa cookies para la sesion. Para que el navegador envie la cookie en las peticiones al backend (que esta en otro puerto), necesitamos `withCredentials: true`:

```js
const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});
```

### Servicios por dominio

Cada dominio (auth, products, categories) tiene su propio archivo de servicio con funciones nombradas:

```js
// services/auth.service.js
const http = axios.create({ baseURL: "/api", withCredentials: true });
http.interceptors.response.use((r) => r.data);

export function login(email, password) {
  return http.post("/auth/login", { email, password });
}
export function getProfile() {
  return http.get("/auth/me");
}
```

El componente importa y llama a la funcion:
```jsx
import { login } from "../services/auth.service";

const user = await login("admin@test.com", "password123");
```

### Proxy en Vite — evitar CORS en desarrollo

En vez de configurar CORS manualmente, Vite puede hacer de proxy: las peticiones a `/api` se redirigen al backend automaticamente.

En `vite.config.js`:
```js
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

Asi, cuando el frontend pide `/api/products`, Vite lo redirige a `http://localhost:3000/api/products`. El navegador cree que todo viene del mismo origen → no hay problemas de CORS.

### Context API — estado global en React

El Context API permite compartir datos con cualquier componente sin pasar props manualmente en cada nivel (evita "prop drilling").

Patron:
1. **Crear** el contexto con `createContext()`.
2. **Proveer** el valor con un componente Provider que envuelve la app.
3. **Consumir** el valor en cualquier componente con `useContext()`.

```jsx
// 1. Crear
const AuthContext = createContext();

// 2. Proveer
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Consumir (en cualquier componente)
function Navbar() {
  const { user } = useContext(AuthContext);
  return <span>{user ? user.name : "Invitado"}</span>;
}
```

### Re-renders y Context — lo que hay que saber

Cuando el `value` del Provider cambia (por ejemplo, cuando el usuario hace login y `user` pasa de `null` a un objeto), **todos los componentes que consumen ese contexto se re-renderizan automaticamente**. No importa donde esten en el arbol de componentes.

Esto es potente pero tiene un coste: si pones demasiados datos en un contexto y este cambia con frecuencia, puedes causar re-renders innecesarios. Para el contexto de auth, no es un problema porque `user` solo cambia al hacer login/logout/register.

### Nuestro AuthContext — que hace

1. Al montar la app, llama a `GET /api/auth/me` para ver si hay sesion activa.
2. Si hay sesion → guarda el usuario en el estado.
3. Si no hay sesion → el usuario queda como `null`.
4. Expone funciones `login`, `logout`, `register` que actualizan el estado.
5. Mientras carga, muestra un estado de loading para no flashear contenido.

El `loading` es importante: sin el, la app mostraria brevemente el estado "no logueado" antes de que llegue la respuesta de `/api/auth/me`, causando un parpadeo visual (el usuario ve el boton "Login" por un instante aunque ya estuviera logueado).

### Custom hook para el contexto

Para no repetir `useContext(AuthContext)` en cada componente, creamos un hook personalizado:

```jsx
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

Uso: `const { user, login, logout } = useAuth();`

La comprobacion `if (!context)` captura el caso en que alguien intente usar `useAuth()` fuera del `AuthProvider` (por ejemplo, si olvidan envolverlo en `main.jsx`). Sin esa comprobacion, el error seria mucho mas críptico.

---

## Tareas (~3h)

### Tarea 1 — Instalar Axios (~5min)

```bash
cd web
npm install axios
```

### Tarea 2 — Configurar proxy en Vite (~10min)

Actualiza `web/vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

### Tarea 3 — Crear servicio de auth (~20min)

Crea `web/src/services/auth.service.js`:

```js
import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

http.interceptors.response.use((response) => response.data);

export function login(email, password) {
  return http.post("/auth/login", { email, password });
}

export function register(data) {
  return http.post("/auth/register", data);
}

export function logout() {
  return http.post("/auth/logout");
}

export function getProfile() {
  return http.get("/auth/me");
}

export function updateProfile(data) {
  return http.patch("/auth/me", data);
}

export function createInvitation() {
  return http.post("/admin/invitations");
}
```

### Tarea 4 — Crear servicio de categorias y reviews (~15min)

Las categorias son una lista predefinida devuelta por el backend — no hay CRUD.

Crea `web/src/services/categories.service.js`:

```js
import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

http.interceptors.response.use((response) => response.data);

export function getCategories() {
  return http.get("/categories");
}
```

Crea `web/src/services/reviews.service.js`:

```js
import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

http.interceptors.response.use((response) => response.data);

export function getReviews(productId) {
  return http.get(`/products/${productId}/reviews`);
}

export function createReview(productId, data) {
  return http.post(`/products/${productId}/reviews`, data);
}
```

### Tarea 5 — Crear servicio de productos (~15min)

Crea `web/src/services/products.service.js`:

```js
import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

http.interceptors.response.use((response) => response.data);

export function getProducts(params = {}) {
  return http.get("/products", { params });
}

export function getProduct(id) {
  return http.get(`/products/${id}`);
}

export function createProduct(formData) {
  return http.post("/products", formData);
}

export function updateProduct(id, formData) {
  return http.patch(`/products/${id}`, formData);
}

export function deleteProduct(id) {
  return http.delete(`/products/${id}`);
}
```

Nota: `createProduct` y `updateProduct` reciben `formData` (no JSON) porque incluyen archivos. Lo construiremos cuando hagamos el formulario de producto.

### Tarea 6 — Crear el AuthContext (~45min)

Crea `web/src/contexts/auth.context.jsx`:

```jsx
import { createContext, useContext, useState, useEffect } from "react";
import * as AuthService from "../services/auth.service";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar, comprobar si hay sesion activa
  useEffect(() => {
    AuthService.getProfile()
      .then((userData) => setUser(userData))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const userData = await AuthService.login(email, password);
    setUser(userData);
    return userData;
  }

  async function register(data) {
    const userData = await AuthService.register(data);
    setUser(userData);
    return userData;
  }

  async function logout() {
    await AuthService.logout();
    setUser(null);
  }

  const value = { user, loading, login, register, logout };

  // Mientras carga, no renderizar nada (o un spinner)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Tarea 7 — Envolver la app con AuthProvider (~10min)

Actualiza `web/src/main.jsx`:

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/auth.context";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
```

### Tarea 8 — Actualizar Navbar para mostrar estado de auth (~20min)

Actualiza `web/src/components/layout/Navbar.jsx`:

```jsx
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/auth.context";

function Navbar() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Retail Catalog
          </Link>

          <div className="flex gap-4 items-center">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-900"
              }
            >
              Catalogo
            </NavLink>

            {user ? (
              <>
                <NavLink
                  to="/admin/products"
                  className={({ isActive }) =>
                    isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-900"
                  }
                >
                  Admin
                </NavLink>
                <span className="text-gray-500 text-sm">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-900"
                }
              >
                Login
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
```

### Tarea 9 — Probar la integracion (~20min)

1. Arranca el backend: `cd api && npm run dev`
2. Arranca el frontend: `cd web && npm run dev`
3. Abre `http://localhost:5173`

Sin login:
- La navbar muestra "Catalogo" y "Login"
- No muestra "Admin" ni el nombre del usuario

Haz login desde Postman (para que la cookie exista):
- Luego recarga la pagina del frontend
- Si la sesion es valida, la navbar deberia mostrar el nombre del admin + "Admin" + "Logout"

(Todavia no tenemos el formulario de login en el frontend, pero el contexto ya funciona si la sesion existe.)

---

## Refuerzo (~30min)

- Abre las DevTools del navegador → Network → mira las peticiones al cargar la pagina. Deberias ver una peticion a `/api/auth/me`.
- Si no hay sesion, esa peticion devuelve 401 y el contexto pone `user = null`.
- Revisa que cada servicio exporta funciones con nombres claros y que NO exporta la instancia `http`.

---

## Checklist

- [ ] Axios instalado
- [ ] Proxy configurado en vite.config.js (/api -> localhost:3000)
- [ ] auth.service.js con login, register, logout, getProfile, updateProfile, createInvitation
- [ ] categories.service.js con getCategories (solo esta funcion — no hay CRUD de categorias)
- [ ] reviews.service.js con getReviews y createReview
- [ ] products.service.js con getProducts, getProduct, createProduct, updateProduct, deleteProduct
- [ ] AuthContext creado con user, loading, login, register, logout
- [ ] AuthProvider envuelve la app en main.jsx
- [ ] useAuth hook personalizado
- [ ] AuthProvider comprueba sesion al montar (GET /me)
- [ ] Navbar muestra estado diferente segun user logueado o no
- [ ] Logout funciona desde la navbar
- [ ] Proxy funciona: peticiones /api llegan al backend
