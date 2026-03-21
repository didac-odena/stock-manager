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
    if (searchTerm === currentSearch) return;

    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);

        if (searchTerm) next.set("search", searchTerm);
        else next.delete("search");

        next.set("page", "1");
        return next;
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, currentSearch, setSearchParams]);

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">catálogo</h1>

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
