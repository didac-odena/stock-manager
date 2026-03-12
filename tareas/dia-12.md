# Dia 12 — Paginas Login y Register (React Hook Form)

> Objetivo: implementar los formularios de login y registro con React Hook Form, validacion inline, manejo de errores del backend, y redireccion tras login exitoso.

---

## Estudio (~1h)

### React Hook Form — por que y como

React Hook Form (RHF) simplifica los formularios en React. En vez de crear un `useState` por cada campo y un `onChange` por cada input, RHF lo gestiona todo internamente.

```bash
npm install react-hook-form
```

### Conceptos basicos de RHF

**1. useForm()** — el hook principal:
```jsx
const { register, handleSubmit, formState: { errors } } = useForm();
```

**2. register** — conecta un input al formulario:
```jsx
<input {...register("email", { required: "El email es obligatorio" })} />
```
`register` devuelve props (`name`, `onChange`, `onBlur`, `ref`) que se inyectan al input.

**3. handleSubmit** — envuelve tu funcion de envio:
```jsx
<form onSubmit={handleSubmit(onSubmit)}>
```
Solo llama a `onSubmit` si TODAS las validaciones pasan.

**4. errors** — mensajes de error de validacion:
```jsx
{errors.email && <span className="text-red-500">{errors.email.message}</span>}
```

### Validaciones con register

```jsx
<input
  {...register("email", {
    required: "El email es obligatorio",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
      message: "Formato de email no valido",
    },
  })}
/>

<input
  type="password"
  {...register("password", {
    required: "La contrasena es obligatoria",
    minLength: {
      value: 8,
      message: "Minimo 8 caracteres",
    },
  })}
/>
```

### Deshabilitar boton mientras se envia

RHF proporciona `isSubmitting` en `formState`:

```jsx
const { formState: { errors, isSubmitting } } = useForm();

<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? "Enviando..." : "Entrar"}
</button>
```

### Errores del backend

Cuando el backend devuelve un error (ej: "Invalid credentials"), queremos mostrarlo en el formulario. Usamos un estado local para eso:

```jsx
const [apiError, setApiError] = useState("");

async function onSubmit(data) {
  try {
    setApiError("");
    await login(data.email, data.password);
    navigate("/admin/products");
  } catch (error) {
    setApiError(error.response?.data?.message || "Error inesperado");
  }
}
```

### useNavigate — redirigir tras login

```jsx
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

// Tras login exitoso
navigate("/admin/products");
```

### Conflicto de nombres — `register` en RegisterPage

`RegisterPage` usa dos `register` distintos al mismo tiempo: el de `useAuth` (la funcion para crear cuenta) y el de `useForm` (el que conecta inputs al formulario). Tienen el mismo nombre pero son cosas completamente diferentes.

La solucion es renombrar uno al desestructurar:

```jsx
// "register" de useAuth lo renombramos a "registerUser" para evitar el conflicto
const { user, register: registerUser } = useAuth();

// "register" de useForm se queda con su nombre original
const { register, handleSubmit, formState: { errors } } = useForm();
```

De esta forma `register` dentro del JSX siempre es el de React Hook Form (conecta los inputs), y `registerUser` es la funcion del contexto que llama al backend.

### Proteger rutas — redirigir si ya estas logueado

Si un usuario logueado accede a `/login`, deberia redirigirse automaticamente:

```jsx
function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/admin/products");
  }, [user, navigate]);

  // ... formulario
}
```

---

## Tareas (~3.5h)

### Tarea 1 — Instalar React Hook Form (~5min)

```bash
cd web
npm install react-hook-form
```

### Tarea 2 — Pagina de Login (~1h)

Actualiza `web/src/pages/LoginPage.jsx`:

```jsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth.context";

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (user) navigate("/admin/products");
  }, [user, navigate]);

  async function onSubmit(data) {
    try {
      setApiError("");
      await login(data.email, data.password);
      navigate("/admin/products");
    } catch (error) {
      setApiError(error.response?.data?.message || "Error al iniciar sesion");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold text-center mb-8">Iniciar sesion</h1>

      {apiError && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("email", {
              required: "El email es obligatorio",
            })}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("password", {
              required: "La contrasena es obligatoria",
            })}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Tienes una invitacion?{" "}
        <Link to="/register" className="text-blue-600 hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
```

### Tarea 3 — Pagina de Register (~45min)

Crea `web/src/pages/RegisterPage.jsx`:

```jsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth.context";

function RegisterPage() {
  const { user, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (user) navigate("/admin/products");
  }, [user, navigate]);

  async function onSubmit(data) {
    try {
      setApiError("");
      await registerUser(data);
      navigate("/admin/products");
    } catch (error) {
      setApiError(error.response?.data?.message || "Error al registrarse");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold text-center mb-8">Registro con invitacion</h1>

      {apiError && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
            Token de invitacion
          </label>
          <input
            id="token"
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("token", {
              required: "El token de invitacion es obligatorio",
            })}
          />
          {errors.token && (
            <p className="text-red-500 text-sm mt-1">{errors.token.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("name", {
              required: "El nombre es obligatorio",
            })}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("email", {
              required: "El email es obligatorio",
            })}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("password", {
              required: "La contrasena es obligatoria",
              minLength: {
                value: 8,
                message: "Minimo 8 caracteres",
              },
            })}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Registrando..." : "Registrarse"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Ya tienes cuenta?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
```

### Tarea 4 — Probar Login (~30min)

1. Asegurate de que el backend esta corriendo con el admin del seed.
2. Ve a `http://localhost:5173/login`
3. Prueba:
   - Enviar formulario vacio → mensajes de validacion inline
   - Email correcto + password incorrecta → error del backend "Invalid credentials"
   - Login correcto → redirige a /admin/products
   - La navbar cambia: muestra nombre del admin + Admin + Logout
   - Si refrescas la pagina, el usuario sigue logueado (la cookie persiste)

### Tarea 5 — Probar Register (~20min)

1. Primero genera una invitacion desde Postman (POST /api/admin/invitations logueado).
2. Haz logout desde la navbar.
3. Ve a `http://localhost:5173/register`
4. Rellena el formulario con el token copiado.
5. Deberia registrar, loguearse y redirigir a /admin/products.

### Tarea 6 — Probar redireccion de logueados (~10min)

1. Estando logueado, navega manualmente a `http://localhost:5173/login`
2. Deberia redirigirte automaticamente a /admin/products.
3. Lo mismo con /register.

---

## Refuerzo (~30min)

- Prueba a desconectar el backend y enviar el formulario → el catch deberia capturar el error de red.
- Mira en DevTools → Network las peticiones que se hacen al hacer login (POST /api/auth/login → respuesta con Set-Cookie).
- Revisa como `useAuth()` proporciona `login` y `register` — son funciones async que actualizan el estado y el componente las usa directamente.

---

## Checklist

- [ ] React Hook Form instalado
- [ ] LoginPage con formulario funcional
- [ ] RegisterPage con formulario funcional
- [ ] Validacion inline (required, minLength)
- [ ] Errores del backend mostrados en el formulario
- [ ] Boton deshabilitado mientras se envia
- [ ] Login exitoso redirige a /admin/products
- [ ] Register exitoso redirige a /admin/products
- [ ] Navbar se actualiza tras login/logout
- [ ] Usuarios logueados redirigidos si acceden a /login o /register
- [ ] Sesion persiste tras refrescar la pagina
