# Dia 20 — Acceso público real + mejoras admin + rediseño dark

> Objetivo: que un visitante (sin login) pueda ver catálogo, detalle y reviews; ocultar datos sensibles de stock; mejorar UX admin (búsqueda y escaneo) y aplicar nuevo look&feel dark/minimal en toda la app.

---

## Resumen

1. Corregir y blindar el flujo público: `/products`, `/products/:id` y reviews visibles sin autenticación.
2. Ocultar stock numérico a visitantes (mostrar solo disponibilidad), con protección en backend y frontend.
3. Añadir buscador reutilizable en `/admin/products`.
4. Mejorar reviews en detalle: media + total + actualización inmediata al crear review.
5. Integrar escáner en edición de producto y ajustar `/admin/barcode` para redirigir a edición.
6. Aplicar rediseño visual dark/minimal global (público + admin + auth).

---

## Cambios de Implementación

### 1) Acceso público y visibilidad de stock (nuevo requisito)

1. Revisar rutas públicas y dejar explícito este contrato:
   - Visitante puede consumir `GET /api/products`, `GET /api/products/:id`, `GET /api/products/:id/reviews`, `POST /api/products/:id/reviews`.
   - Visitante no puede acceder a acciones admin (`/admin/*`, create/update/delete, barcode lookup privado).
2. Implementar protección `API + UI` para stock:
   - Backend: en respuestas de producto para visitante, no devolver `stock` ni campos sensibles de admin (por ejemplo `barcode`).
   - Backend: devolver `isAvailable` (boolean) para que el frontend público muestre “Disponible/Agotado” sin cantidad.
   - Frontend público: usar `isAvailable`; no mostrar número de unidades.
3. Añadir manejo de error visible en catálogo/detalle para evitar “pantalla vacía” cuando falla una petición:
   - `CatalogPage`: estado de error con mensaje claro.
   - `ProductDetailPage`: cargar producto y reviews de forma tolerante (si fallan reviews, mantener detalle del producto visible y mostrar aviso en sección reviews).

### 2) Buscador en admin products (reutilizable)

1. Extraer un componente de búsqueda reutilizable y usarlo en:
   - Catálogo público.
   - Admin products.
2. En `AdminProductsPage`:
   - Añadir `searchTerm` con debounce de 300 ms.
   - Pasar `search` al `getProducts`.
   - Resetear a página 1 al cambiar búsqueda.
   - Mantener paginación y borrado sobre el dataset filtrado.

### 3) Reviews en detalle de producto

1. En `ProductDetailPage`, calcular y mostrar:
   - Total de valoraciones (`reviews.length`).
   - Media (`averageRating`) con 1 decimal.
2. Tras `createReview`, actualizar localmente `reviews` para que total/media cambien al instante.
3. Estado vacío consistente: “Sin valoraciones” cuando no hay reviews.

### 4) Escáner: edición de producto + flujo `/admin/barcode`

1. `AdminProductFormPage`:
   - Añadir botón “Escanear código”.
   - Activar cámara con `useZxing`.
   - Al detectar código, rellenar campo `barcode` automáticamente.
   - Botón de reescaneo y control de lecturas repetidas.
2. `AdminBarcodePage`:
   - Al encontrar producto, redirigir automáticamente a `/admin/products/:id/edit` (decisión cerrada).
   - Si no existe, mostrar “Producto no encontrado” y permitir reintento rápido.

### 5) Rediseño dark/minimal global

1. Definir tokens visuales globales en CSS (fondos oscuros, superficies, texto, acento, estados).
2. Aplicar sistema en layouts y páginas públicas/admin/auth.
3. Mantener interfaz limpia y legible:
   - Contraste alto.
   - Jerarquía visual clara.
   - Animaciones discretas y útiles (sin sobrecarga).

---

## Interfaces y Contratos (cambios importantes)

1. Respuesta de productos:
   - Nuevo campo `isAvailable` en list/detail para público.
   - `stock` oculto a visitantes; visible para usuarios autenticados en pantallas admin.
2. Comportamiento público:
   - Visitante puede navegar catálogo/detalle/reviews sin sesión.
   - No se exponen acciones ni datos de administración.
3. Escáner admin:
   - `/admin/barcode` cambia contrato UX a “éxito = redirección a edición”.

---

## Test Plan

1. Visitante (sin login):
   - Entra a `/products` y ve listado.
   - Entra a `/products/:id` y ve detalle + reviews.
   - Puede enviar review.
   - No ve cantidad de stock; sí ve “Disponible/Agotado”.
   - Acceso a `/admin/products` redirige a `/login`.
2. Usuario autenticado:
   - Admin products sigue mostrando stock numérico y acciones de edición.
   - Buscador admin filtra correctamente y respeta paginación.
3. Escáner:
   - En edición de producto, escaneo rellena `barcode`.
   - En `/admin/barcode`, código existente redirige a edición.
   - Código inexistente muestra “Producto no encontrado”.
4. Calidad:
   - `npm run lint` y `npm run build` en `web`.
   - Pruebas manuales responsive (móvil + desktop) del nuevo tema dark.

---

## Asunciones cerradas

1. Stock público: mostrar solo disponibilidad, nunca unidades (decidido).
2. Protección de stock: aplicar en backend y frontend (decidido).
3. Alcance visual: toda la app en esta iteración (decidido).
4. Escáner admin: redirección automática a edición cuando hay match (decidido).
