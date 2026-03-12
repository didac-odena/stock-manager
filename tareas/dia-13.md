# Dia 13 — Landing page (Home)

> Objetivo: construir la pagina principal con hero, categorias destacadas y productos destacados. Es el dia mas visual — consumimos los servicios que ya creamos y damos estilo con Tailwind.

---

## Estudio (~45min)

### useEffect + useState para cargar datos

Patron estandar en React para cargar datos al montar un componente:

```jsx
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  getProducts({ limit: 6 })
    .then((response) => setProducts(response.data))
    .catch((error) => console.error(error))
    .finally(() => setLoading(false));
}, []);
```

- `useState([])` — estado inicial vacio. Si pones `null`, tendras que comprobar `if (products)` antes de hacer `.map()`.
- `useEffect(..., [])` — se ejecuta solo al montar el componente (array de dependencias vacio).
- `.finally()` — se ejecuta siempre (exito o error), ideal para quitar el loading.

### Promise.all — cargar varios recursos en paralelo

La Home necesita dos cosas: la lista de categorias y los productos destacados. Podriamos cargarlas en secuencia:

```js
// Secuencial: si cada peticion tarda 100ms, total = 200ms
const categories = await getCategories();
const products = await getProducts({ limit: 6 });
```

Pero son independientes — ninguna necesita el resultado de la otra. Con `Promise.all` se lanzan en paralelo:

```js
// Paralelo: ambas peticiones salen al mismo tiempo, total = ~100ms (la mas lenta)
const [categories, productsResponse] = await Promise.all([
  getCategories(),
  getProducts({ limit: 6 }),
]);
```

`Promise.all` devuelve un array con los resultados en el mismo orden que el array de promesas de entrada. Si cualquiera de las dos falla, el `.catch()` lo captura.

Dentro de un `useEffect` con promesas, el patron queda asi:

```js
useEffect(() => {
  Promise.all([getCategories(), getProducts({ limit: 6 })])
    .then(([categoriesData, productsResponse]) => {
      setCategories(categoriesData);
      setFeaturedProducts(productsResponse.data);
    })
    .catch((error) => console.error(error))
    .finally(() => setLoading(false));
}, []);
```

### Componentes reutilizables

Cuando un patron de UI se repite (como las tarjetas de producto), extraemos un componente:

```jsx
// components/ProductCard.jsx
function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <img src={product.images[0]} alt={product.name} />
      <div className="p-4">
        <h3>{product.name}</h3>
        <p>{product.price} EUR</p>
      </div>
    </div>
  );
}
```

Asi lo reutilizamos en la home, el catalogo, etc.

### Imagen por defecto

Si un producto no tiene imagenes, mostramos una imagen generica:

```jsx
const imageUrl = product.images.length > 0
  ? product.images[0]
  : "/placeholder-product.png";
```

Puedes usar cualquier imagen placeholder. Una opcion sencilla es poner una imagen en `web/public/placeholder-product.png`.

### Estructura de la Home (del wireframe)

```
┌──────────────────────────────────────┐
│  Hero: nombre tienda + CTA          │
├──────────────────────────────────────┤
│  Categorias destacadas (cards)       │
├──────────────────────────────────────┤
│  Productos destacados (cards)        │
└──────────────────────────────────────┘
```

---

## Tareas (~3.5h)

### Tarea 1 — Crear componente ProductCard (~30min)

Crea `web/src/components/ProductCard.jsx`:

```jsx
import { Link } from "react-router-dom";

function ProductCard({ product }) {
  const imageUrl = product.images.length > 0
    ? product.images[0]
    : "/placeholder-product.png";

  const isAvailable = product.stock > 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-lg font-bold text-gray-900">
            {product.price.toFixed(2)} EUR
          </span>
          {!isAvailable && (
            <span className="text-sm text-red-500 font-medium">Agotado</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
```

### Tarea 2 — Crear componente CategoryCard (~15min)

Las categorias son strings (ej: `"Ropa"`), no objetos con `id` y `name`. El componente recibe la cadena directamente.

Crea `web/src/components/CategoryCard.jsx`:

```jsx
import { Link } from "react-router-dom";

function CategoryCard({ category }) {
  return (
    <Link
      to={`/products?category=${encodeURIComponent(category)}`}
      className="bg-white rounded-lg shadow p-6 text-center hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-gray-900">{category}</h3>
    </Link>
  );
}

export default CategoryCard;
```

### Tarea 3 — Implementar la HomePage (~1.5h)

Actualiza `web/src/pages/HomePage.jsx`:

```jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../services/categories.service";
import { getProducts } from "../services/products.service";
import ProductCard from "../components/ProductCard";
import CategoryCard from "../components/CategoryCard";

function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCategories(),       // devuelve string[] (lista predefinida)
      getProducts({ limit: 6 }),
    ])
      .then(([categoriesData, productsResponse]) => {
        setCategories(categoriesData);
        setFeaturedProducts(productsResponse.data);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Retail Catalog
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Tu tienda de confianza, ahora online
          </p>
          <Link
            to="/products"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Ver catalogo
          </Link>
        </div>
      </section>

      {/* Categorias */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Categorias</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* Productos destacados */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Productos destacados
            </h2>
            <Link
              to="/products"
              className="text-blue-600 hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;
```

### Tarea 4 — Anadir imagen placeholder (~10min)

Descarga o crea una imagen generica y guardala como `web/public/placeholder-product.png`.

Puedes usar cualquier imagen gris con un icono de imagen. O simplemente un cuadrado gris de 400x400px.

### Tarea 5 — Probar la Home (~30min)

1. Asegurate de que tienes categorias y productos en la base de datos (del dia 8).
2. Arranca backend y frontend.
3. Abre `http://localhost:5173/`

Verifica:
- El hero se muestra con el boton "Ver catalogo".
- Las categorias aparecen como tarjetas.
- Los productos destacados aparecen como tarjetas con imagen, nombre y precio.
- Productos sin stock muestran "Agotado".
- Productos sin imagenes muestran la imagen placeholder.
- Hacer clic en una categoria lleva a `/products?category=Ropa` (el nombre de la categoria, no un ID).
- Hacer clic en un producto lleva a `/products/<id>`.
- El boton "Ver catalogo" lleva a `/products`.

### Tarea 6 — Ajustar estilos (~30min)

Dedica un rato a pulir el aspecto visual:
- Espaciados entre secciones
- Tamanos de fuente
- Colores (puedes cambiar el azul por otro color si prefieres)
- Responsive: prueba en mobile (DevTools → responsive mode)

---

## Refuerzo (~30min)

- Mira en DevTools → Network las peticiones que se hacen al cargar la Home (deberian ser 2: categorias y productos).
- Comprueba que `Promise.all` las ejecuta en paralelo (ambas empiezan al mismo tiempo).
- Si tienes mas de 6 productos, verifica que solo se muestran 6 en la home (limit: 6).

---

## Checklist

- [ ] ProductCard componente creado y reutilizable
- [ ] CategoryCard componente creado
- [ ] Hero con titulo, tagline y boton CTA
- [ ] Seccion de categorias con tarjetas
- [ ] Seccion de productos destacados (ultimos 6)
- [ ] Productos sin stock muestran "Agotado"
- [ ] Productos sin imagenes muestran placeholder
- [ ] Click en categoria lleva al catalogo filtrado
- [ ] Click en producto lleva al detalle
- [ ] Loading state mientras cargan los datos
- [ ] Datos cargados en paralelo con Promise.all
- [ ] Responsive: se ve bien en mobile y desktop
