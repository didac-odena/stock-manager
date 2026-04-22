# Dia 9 — Coleccion Postman + cierre del backend

> Objetivo: crear la coleccion Postman completa que cubra todos los endpoints, verificar que el backend esta completo y cerrar el sprint de backend. A partir del dia 10 empieza el frontend.

---

## Estudio (~30min)

### Por que una coleccion Postman

Una coleccion Postman bien organizada es tu "documentacion viva" del backend. Sirve para:
- Probar rapidamente cualquier endpoint sin recordar la sintaxis.
- Compartirla con companeros o el profe para que puedan probar tu API.
- Detectar regresiones si cambias algo.

Organiza las requests en carpetas por dominio y nombra cada una con el metodo y la accion: "POST Login", "GET Products (paginado)", "POST Review (sin auth)".

### Variables de entorno en Postman

En lugar de repetir `http://localhost:3000` en cada URL, usa una variable de entorno de Postman:
1. Crea un entorno llamado "Local".
2. Anade la variable `baseUrl` = `http://localhost:3000`.
3. Usa `{{baseUrl}}` en todas las URLs.

### Que probar en cada endpoint — happy path y error paths

Para cada endpoint hay que probar al menos dos tipos de casos:

**Happy path** (el caso que debe funcionar):
- Los datos son correctos, el usuario tiene los permisos necesarios, todo va bien.
- Verifica: codigo de estado correcto (200, 201, 204) y que el body de la respuesta tiene la forma esperada.

**Error paths** (los casos que deben fallar de forma controlada):
- Datos invalidos → 400 o 422
- No autenticado cuando se requiere → 401
- Recurso no encontrado → 404
- Conflicto (duplicado) → 409

Ejemplos para el endpoint `POST /api/products`:
1. (happy) Logueado + datos validos + con imagen → 201 + producto creado
2. (happy) Logueado + datos validos + sin imagen → 201 + producto con `images: []`
3. (error) Sin login → 401
4. (error) Sin nombre → 400 (ValidationError)
5. (error) Categoria invalida → 400
6. (error) Barcode ya existente → 409

### Por que esto importa

Probar solo el happy path da falsa seguridad. La mayoria de los bugs aparecen en los casos de error: cuando el ID no existe, cuando los datos son incorrectos, cuando el token ha expirado. Si tu error handler devuelve el mensaje equivocado o el codigo de estado incorrecto, el frontend no podra mostrar el error al usuario de forma correcta.

---

## Tareas (~3.5h)

### Tarea 1 — Coleccion Postman completa (~45min)

Crea una coleccion en Postman con TODOS los endpoints del proyecto, organizados por carpetas:

```
Retail Catalog API
  Auth
    POST Register (con token de invitacion)
    POST Login
    POST Logout
    GET Me
    PATCH Update Profile
  Invitations
    POST Create Invitation
  Categories
    GET List Categories (publica)
  Products
    GET List Products
    GET List Products (filtro: ?category=Ropa)
    GET List Products (busqueda: ?search=cam)
    GET List Products (paginacion: ?page=2&limit=3)
    GET Product Detail
    GET Product by Barcode
    POST Create Product (form-data con imagenes)
    POST Create Product (sin imagenes)
    PATCH Update Product
    PATCH Update Stock (solo campo stock)
    DELETE Delete Product
  Reviews
    GET Reviews del producto (publica)
    POST Create Review (publica, sin login)
    POST Create Review duplicada (→ 409)
```

Para cada endpoint:
1. Configura la URL, metodo, body y headers.
2. Ejecuta y verifica que funciona.
3. Guarda la respuesta de ejemplo.

Cuando termines, exporta la coleccion como JSON y guardala en `api/data/postman-collection.json`.

---

### Tarea 2 — Repaso de endpoints del PRD (~30min)

Abre `prd.md` y compara la tabla de endpoints (seccion 4) con tu coleccion Postman. Verifica que tienes cubiertos:

- Auth: register, login, logout, me, updateProfile
- Invitations: createInvitation
- Categories: GET /categories (lista predefinida)
- Products: list, detail, barcode lookup, create, update, delete
- Reviews: list, create

### Tarea 3 — Prueba de flujo completo (~1h)

Haz el flujo completo de punta a punta sin parar:

1. Ejecuta el seed: `npm run seed`
2. Login como admin
3. Crea un producto con imagenes (form-data)
4. Listalo con filtro por categoria
5. Busca por barcode (si el producto tiene uno)
6. Como visitante (sin login): crea una review
7. Intenta crear una segunda review con el mismo email → 409
8. Lista las reviews del producto
9. Edita el stock del producto
10. Cierra sesion (logout)
11. Verifica que el endpoint protegido devuelve 401

### Tarea 4 — Verificacion final del backend (~30min)

Repasa el checklist de requisitos del PRD y marca los que esten completos. Anota cualquier cosa que falte o este rota para resolverla antes de pasar al frontend.

---

## Refuerzo (~30min)

- Revisa el `routes.config.js` final — deberia tener todas las rutas ordenadas logicamente.
- Mira la estructura de carpetas `api/` — deberia coincidir exactamente con la del CLAUDE.md.
- Compara la respuesta de `GET /products` con el formato esperado en el PRD (`{ meta, data }`).

---

## Checklist

- [ ] Coleccion Postman completa con todos los endpoints organizados por carpetas
- [ ] Coleccion exportada en `api/data/postman-collection.json`
- [ ] Flujo completo probado: seed → login → crear producto → review → logout
- [ ] GET /categories devuelve el array predefinido (no desde BD)
- [ ] GET /products/barcode/:code funciona (requiere auth)
- [ ] POST /products/:id/reviews funciona sin autenticacion
- [ ] Review duplicada devuelve 409
- [ ] Todos los endpoints del PRD estan implementados y funcionando
- [ ] Estructura de carpetas del backend coincide con CLAUDE.md
