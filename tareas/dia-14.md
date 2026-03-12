# Dia 14 — Catalogo: listado + filtros + busqueda + paginacion

> Objetivo: implementar la pagina de catalogo completa con filtro por categoria, busqueda por nombre y paginacion. Es la pagina publica mas compleja.

---

## Estudio (~1h)

### useSearchParams — leer y escribir query params

React Router proporciona `useSearchParams` para manejar los parametros de la URL (lo que va despues del `?`):

```jsx
import { useSearchParams } from "react-router-dom";

const [searchParams, setSearchParams] = useSearchParams();

// Leer
const category = searchParams.get("category");  // string o null
const page = searchParams.get("page") || "1";

// Escribir (reemplaza todos los params)
setSearchParams({ category: "abc123", page: "1" });

// Escribir un param sin borrar los demas
setSearchParams((prev) => {
  prev.set("page", "2");
  return prev;
});
```

Usar searchParams tiene ventajas:
- La URL es compartible (puedes copiarla y pegarla).
- El boton atras del navegador funciona.
- Al refrescar, los filtros se mantienen.

### Debounce en la busqueda

Sin debounce, cada letra que escribes hace una peticion al backend. Con debounce, la peticion se retrasa hasta que dejas de escribir por un tiempo (ej: 300ms).

Implementacion simple con setTimeout:

```jsx
const [searchTerm, setSearchTerm] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    // Actualizar los searchParams con el termino
    setSearchParams((prev) => {
      if (searchTerm) prev.set("search", searchTerm);
      else prev.delete("search");
      prev.set("page", "1");  // resetear a pagina 1
      return prev;
    });
  }, 300);

  return () => clearTimeout(timer);  // limpiar el timer anterior
}, [searchTerm]);
```

**Por que funciona el debounce con cleanup:**
React ejecuta la funcion de cleanup del `useEffect` anterior antes de ejecutar el nuevo. Si el usuario escribe rapido ("c", "ca", "cam"), cada letra dispara un nuevo efecto que cancela el timer del anterior. La peticion solo se lanza cuando el usuario deja de escribir 300ms.

```
Tecla "c"  → crea timer de 300ms
Tecla "ca" → cancela timer anterior → crea nuevo timer de 300ms
Tecla "cam"→ cancela timer anterior → crea nuevo timer de 300ms
    ... 300ms de silencio ...
         → lanza peticion con "cam"
```

Sin el `return () => clearTimeout(timer)`, cada tecla acumularia un timer y todos se lanzarian al terminar los 300ms.

### El problema de los objetos en el array de dependencias

Una trampa comun: si construyes un objeto dentro del efecto o del componente y lo pones como dependencia, causas un bucle infinito.

```js
// MAL — bucle infinito
const params = { category, search, page };  // nuevo objeto en cada render

useEffect(() => {
  getProducts(params);
}, [params]);  // React compara por referencia: siempre diferente → siempre se ejecuta
```

React compara las dependencias con `Object.is()`. Para objetos, compara referencias. Un objeto literal `{}` nunca es identico a otro `{}` aunque tengan las mismas propiedades.

```js
// BIEN — valores primitivos
useEffect(() => {
  getProducts({ category, search, page });
}, [category, search, page]);  // strings y numeros se comparan por valor
```

Pasar siempre strings, numeros o booleanos como dependencias. Si necesitas un objeto, descomponlo en sus partes primitivas.

### Patron de carga con filtros

Cada vez que los filtros cambian (categoria, busqueda, pagina), hacemos una nueva peticion:

```jsx
useEffect(() => {
  const params = { page: currentPage, limit: 12 };
  if (currentCategory) params.category = currentCategory;
  if (currentSearch) params.search = currentSearch;

  getProducts(params)
    .then((response) => {
      setProducts(response.data);
      setMeta(response.meta);
    });
}, [currentCategory, currentSearch, currentPage]);  // valores primitivos, no objeto
```

Nota: Axios omite automaticamente los params con valor `""`, `null` o `undefined`. Por eso, en vez de construir el objeto `params` condicionalmente, algunos proyectos hacen:
```js
getProducts({ category: currentCategory || undefined, search: currentSearch || undefined, page });
```
Ambos enfoques son validos.

### Paginacion — componente

La paginacion muestra botones para navegar entre paginas:

```
[<< Anterior]  Pagina 2 de 4  [Siguiente >>]
```

Los botones actualizan el searchParam `page`.

---

## Tareas (~3.5h)

### Tarea 1 — Implementar CatalogPage (~2h)

Actualiza `web/src/pages/CatalogPage.jsx`:

```jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../services/products.service";
import { getCategories } from "../services/categories.service";
import ProductCard from "../components/ProductCard";

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page")) || 1;

  // Cargar categorias (una sola vez)
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((error) => console.error(error));
  }, []);

  // Cargar productos cuando cambian los filtros
  useEffect(() => {
    setLoading(true);
    const params = { page: currentPage, limit: 12 };
    if (currentCategory) params.category = currentCategory;
    if (currentSearch) params.search = currentSearch;

    getProducts(params)
      .then((response) => {
        setProducts(response.data);
        setMeta(response.meta);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [currentCategory, currentSearch, currentPage]);

  // Debounce de la busqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        if (searchTerm) prev.set("search", searchTerm);
        else prev.delete("search");
        prev.set("page", "1");
        return prev;
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, setSearchParams]);

  function handleCategoryFilter(categoryId) {
    setSearchParams((prev) => {
      if (categoryId) prev.set("category", categoryId);
      else prev.delete("category");
      prev.set("page", "1");
      return prev;
    });
  }

  function handlePageChange(newPage) {
    setSearchParams((prev) => {
      prev.set("page", String(newPage));
      return prev;
    });
    window.scrollTo(0, 0);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Catalogo</h1>

      {/* Barra de busqueda */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filtros de categoria */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => handleCategoryFilter("")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !currentCategory
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => (
          // cat es un string (ej: "Ropa"), no un objeto
          <button
            key={cat}
            onClick={() => handleCategoryFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Productos */}
      {loading ? (
        <div className="flex justify-center py-16">
          <p className="text-gray-500">Cargando productos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No se encontraron productos</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Paginacion */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-gray-600">
                Pagina {meta.page} de {meta.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= meta.totalPages}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default CatalogPage;
```

### Tarea 2 — Probar los filtros (~30min)

1. Navega a `http://localhost:5173/products`
2. Prueba:
   - Escribir en el buscador → los productos se filtran tras dejar de escribir
   - Hacer clic en una categoria → se muestran solo los productos de esa categoria
   - La URL cambia con los filtros (ej: `/products?category=Ropa&search=cam`)
   - Copiar la URL filtrada y pegarla en otra pestana → muestra los mismos resultados
   - Paginacion: si tienes suficientes productos, navegar entre paginas
   - Combinar filtros: categoria + busqueda

### Tarea 3 — Probar la navegacion desde la Home (~15min)

1. Ve a la Home.
2. Haz clic en una categoria → debe ir a `/products?category=Ropa` y mostrar filtrados.
3. Haz clic en "Ver catalogo" → debe ir a `/products` sin filtros.

### Tarea 4 — Ajustar responsive (~30min)

Prueba en diferentes tamanos de pantalla (DevTools → responsive):
- Mobile: 1 columna de productos
- Tablet: 2-3 columnas
- Desktop: 3-4 columnas

El grid ya deberia funcionar con las clases `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.

---

## Refuerzo (~30min)

- Mira en DevTools → Network cuantas peticiones se hacen al escribir en el buscador. Con el debounce, deberia haber UNA peticion por cada "pausa" de escritura, no una por letra.
- Prueba a navegar con el boton atras del navegador despues de cambiar filtros. Los filtros deberian restaurarse.
- Si no tienes muchos productos, crea mas desde Postman para probar la paginacion.

---

## Checklist

- [ ] Barra de busqueda con debounce (300ms)
- [ ] Filtros de categoria como botones/pills
- [ ] Boton "Todas" para quitar filtro de categoria
- [ ] Categoria activa visualmente destacada
- [ ] Productos en grid responsive
- [ ] Estado de loading mientras carga
- [ ] Mensaje "No se encontraron productos" si no hay resultados
- [ ] Paginacion con botones Anterior/Siguiente
- [ ] Paginacion deshabilitada en primera/ultima pagina
- [ ] Filtros reflejados en la URL (searchParams)
- [ ] URL compartible con filtros
- [ ] Boton atras del navegador restaura filtros
- [ ] Desde Home, clic en categoria filtra correctamente
