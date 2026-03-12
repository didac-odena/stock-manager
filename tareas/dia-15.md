# Dia 15 — Detalle de producto + reviews con estrellas

> Objetivo: implementar la pagina de detalle del producto con galeria de imagenes, disponibilidad, y el sistema de reviews (mostrar valoraciones y formulario para que los visitantes dejen su opinion). Dia mas tranquilo tras el catalogo.

---

## Estudio (~30min)

### useParams — leer parametros de la URL

```jsx
import { useParams } from "react-router-dom";

function ProductDetailPage() {
  const { id } = useParams();  // lee el :id de la ruta /products/:id
  // ...
}
```

El `id` es un **string** (React Router siempre devuelve strings), no un ObjectId. Se lo pasas directamente a `getProduct(id)` y el servicio lo incluye en la URL. El backend hace el `findById` con ese string y Mongoose lo convierte internamente.

### Cargar un recurso por ID

```jsx
const [product, setProduct] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  getProduct(id)
    .then(setProduct)
    .catch(() => navigate("/products"))  // si no existe, redirigir
    .finally(() => setLoading(false));
}, [id]);
```

El array de dependencias tiene `[id]` — si el usuario navega de `/products/123` a `/products/456` sin salir de la pagina (por ejemplo, desde los productos relacionados), el efecto se vuelve a ejecutar con el nuevo `id` y carga el producto correcto.

### Gestionar multiples piezas de estado en una pagina compleja

La pagina de detalle gestiona estado del producto Y estado de las reviews. Hay dos enfoques:

**Opcion A — dos useEffect separados (mas claro):**
```jsx
// Efecto 1: cargar el producto
useEffect(() => {
  getProduct(id).then(setProduct).catch(() => navigate("/products")).finally(...);
}, [id]);

// Efecto 2: cargar las reviews (independiente del primero)
useEffect(() => {
  getReviews(id).then(setReviews).catch(() => {});
}, [id]);
```

**Opcion B — un useEffect con Promise.all (mas eficiente):**
```jsx
useEffect(() => {
  Promise.all([getProduct(id), getReviews(id)])
    .then(([productData, reviewsData]) => {
      setProduct(productData);
      setReviews(reviewsData);
    })
    .catch(() => navigate("/products"))
    .finally(() => setLoading(false));
}, [id]);
```

La opcion A es mas facil de leer y de mantener. La opcion B es mas rapida (peticiones en paralelo) pero si `getProduct` falla, `getReviews` tampoco se guarda. Para este proyecto, cualquiera es valida.

### Galeria de imagenes — patron de indice seleccionado

Con multiples imagenes, usamos un estado que guarda el indice de la imagen actualmente visible:

```jsx
const [selectedImage, setSelectedImage] = useState(0);

// Imagen principal — usa el indice para mostrar la imagen correcta
<img src={product.images[selectedImage]} />

// Miniaturas — cada una actualiza el indice al hacer clic
{product.images.map((img, index) => (
  <button
    key={index}
    onClick={() => setSelectedImage(index)}
    className={selectedImage === index ? "border-blue-600" : "border-transparent"}
  >
    <img src={img} />
  </button>
))}
```

La miniatura activa tiene un borde destacado (`selectedImage === index`). Es un patron visual comun: el estado es solo un numero entero, y de el dependen tanto la imagen principal como el estilo de las miniaturas.

Importante: cuando el `id` del producto cambia, hay que resetear el indice a 0:
```jsx
useEffect(() => {
  getProduct(id).then((data) => {
    setProduct(data);
    setSelectedImage(0);  // resetear siempre que cambia el producto
  });
}, [id]);
```

### Actualizacion optimista de la lista de reviews

Cuando el visitante envia una review, tienes dos opciones:
1. Volver a pedir todas las reviews al backend (una peticion extra).
2. Anadir la nueva review al estado local directamente (optimistic update).

En este proyecto usamos la opcion 2 porque el backend devuelve la review recien creada:

```jsx
const newReview = await createReview(id, { email, rating });
setReviews((prev) => [newReview, ...prev]);  // la nueva review va al principio
```

El estado `reviews` ya refleja el cambio sin necesidad de una peticion adicional. Si la peticion hubiera fallado, el `catch` lo habria capturado y no llegariamos a `setReviews`.

### Disponibilidad publica

Segun el PRD, el catalogo publico muestra "Disponible" o "Agotado", nunca la cantidad exacta de stock. Esto protege informacion sensible del negocio (cuanto stock queda) de cara a visitantes y competencia. El admin si ve la cantidad exacta.

---

## Tareas (~3.5h)

### Tarea 1 — Implementar ProductDetailPage (~1.5h)

Actualiza `web/src/pages/ProductDetailPage.jsx`:

```jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getProduct } from "../services/products.service";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    getProduct(id)
      .then((data) => {
        setProduct(data);
        setSelectedImage(0);
      })
      .catch(() => navigate("/products"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <p className="text-gray-500">Cargando producto...</p>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images.length > 0
    ? product.images
    : ["/placeholder-product.png"];

  const isAvailable = product.stock > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Boton volver */}
      <Link
        to="/products"
        className="inline-flex items-center text-blue-600 hover:underline mb-6"
      >
        &larr; Volver al catalogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galeria de imagenes */}
        <div>
          {/* Imagen principal */}
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Miniaturas (solo si hay mas de 1 imagen) */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index
                      ? "border-blue-600"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informacion del producto */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>

          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {product.categories.map((cat) => (
                <Link
                  key={cat}
                  to={`/products?category=${encodeURIComponent(cat)}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">
              {product.price.toFixed(2)} EUR
            </span>
          </div>

          <div className="mt-4">
            {isAvailable ? (
              <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                Disponible
              </span>
            ) : (
              <span className="inline-block bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                Agotado
              </span>
            )}
          </div>

          {product.description && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Descripcion
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
```

### Tarea 2 — Anadir seccion de reviews al detalle (~1h)

Las reviews se cargan aparte del producto y se muestran debajo. El visitante puede dejar una nueva valoracion con su email y entre 1 y 5 estrellas.

Actualiza `ProductDetailPage.jsx` para incluir el estado de reviews y el formulario:

```jsx
import { getReviews, createReview } from "../services/reviews.service";

// Nuevo estado (anadir junto al de product)
const [reviews, setReviews] = useState([]);
const [reviewEmail, setReviewEmail] = useState("");
const [reviewRating, setReviewRating] = useState(0);
const [reviewError, setReviewError] = useState("");
const [reviewSuccess, setReviewSuccess] = useState(false);

// Cargar reviews al montar (anadir dentro del useEffect del producto o en uno separado)
useEffect(() => {
  if (!id) return;
  getReviews(id)
    .then(setReviews)
    .catch(() => {});
}, [id]);

async function handleReviewSubmit(e) {
  e.preventDefault();
  setReviewError("");
  setReviewSuccess(false);

  try {
    const newReview = await createReview(id, { email: reviewEmail, rating: reviewRating });
    setReviews((prev) => [newReview, ...prev]);
    setReviewEmail("");
    setReviewRating(0);
    setReviewSuccess(true);
  } catch (err) {
    if (err.response?.status === 409) {
      setReviewError("Ya has valorado este producto con ese email.");
    } else {
      setReviewError("Error al enviar la valoracion. Inténtalo de nuevo.");
    }
  }
}
```

Anadir el JSX de reviews al final del componente, despues del grid de imagen+info:

```jsx
{/* Seccion de reviews */}
<div className="mt-12">
  <h2 className="text-xl font-bold text-gray-900 mb-6">Valoraciones</h2>

  {/* Formulario nueva review */}
  <div className="bg-gray-50 rounded-lg p-6 mb-8">
    <h3 className="font-semibold text-gray-800 mb-4">Deja tu valoracion</h3>
    <form onSubmit={handleReviewSubmit} className="space-y-4">
      <input
        type="email"
        placeholder="Tu email"
        value={reviewEmail}
        onChange={(e) => setReviewEmail(e.target.value)}
        required
        className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {/* Selector de estrellas */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setReviewRating(star)}
            className={`text-2xl ${star <= reviewRating ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}
      {reviewSuccess && <p className="text-green-600 text-sm">Valoracion enviada. Gracias!</p>}
      <button
        type="submit"
        disabled={!reviewEmail || reviewRating === 0}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Enviar valoracion
      </button>
    </form>
  </div>

  {/* Lista de reviews */}
  {reviews.length === 0 ? (
    <p className="text-gray-500">Aun no hay valoraciones para este producto.</p>
  ) : (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-yellow-400">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
            <span className="text-sm text-gray-500">{review.email}</span>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

### Tarea 3 — Probar el detalle y las reviews (~30min)

1. Navega al catalogo y haz clic en un producto.
2. Verifica:
   - Imagen principal se muestra.
   - Si tiene varias imagenes, las miniaturas aparecen y al hacer clic cambian la imagen principal.
   - Si no tiene imagenes, se muestra el placeholder.
   - Precio formateado con 2 decimales.
   - Las categorias son enlaces que llevan al catalogo filtrado.
   - Disponible/Agotado segun el stock.
   - Descripcion se muestra si existe.
   - Boton "Volver al catalogo" funciona.
   - Las reviews del seed aparecen debajo.
   - El selector de estrellas funciona (clic cambia el color).
   - El formulario de review envia correctamente.
   - Un segundo intento con el mismo email muestra el error de duplicado.

### Tarea 4 — Probar con producto inexistente (~10min)

Navega a `http://localhost:5173/products/000000000000000000000000` (un ID valido pero que no existe). Deberia redirigir al catalogo.

### Tarea 5 — Probar desde distintos puntos de entrada (~15min)

1. Desde la Home → clic en producto destacado → detalle.
2. Desde el catalogo filtrado → clic en producto → detalle.
3. Pegar URL directa del detalle → deberia cargar correctamente.
4. Boton atras del navegador → vuelve a donde estabas.

### Tarea 6 — Pulir estilos (~30min)

Ajusta lo que veas necesario:
- Espaciados
- Tamano de las miniaturas
- Responsive: en mobile la imagen va arriba y el texto abajo (grid cols-1)
- En desktop van lado a lado (grid md:cols-2)

---

## Refuerzo (~30min)

- Este es un buen momento para repasar toda la parte publica: Home → Catalogo → Detalle. Navega como un visitante y comprueba que el flujo es fluido.
- Revisa en DevTools que solo se hace 1 peticion al entrar en el detalle (GET /api/products/:id).
- Si algo no funciona bien (filtros, paginacion, galeria), este dia mas ligero es buen momento para arreglarlo.

---

## Checklist

- [ ] ProductDetailPage implementada
- [ ] useParams lee el :id de la URL
- [ ] Producto se carga al montar el componente
- [ ] Producto inexistente redirige al catalogo
- [ ] Imagen principal se muestra
- [ ] Miniaturas funcionan (clic cambia imagen principal)
- [ ] Productos sin imagenes muestran placeholder
- [ ] Precio con 2 decimales
- [ ] Disponible / Agotado (sin mostrar cantidad)
- [ ] Categorias como enlaces al catalogo filtrado (array de strings)
- [ ] Descripcion visible si existe
- [ ] Boton "Volver al catalogo"
- [ ] Responsive: imagen arriba en mobile, al lado en desktop
- [ ] Reviews del producto se cargan y muestran (con estrellas)
- [ ] Formulario de review con selector de estrellas y campo email
- [ ] Nueva review se anade a la lista sin recargar
- [ ] Review duplicada (mismo email) muestra mensaje de error
- [ ] Flujo completo: Home → Catalogo → Detalle → Review funciona
