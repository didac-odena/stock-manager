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
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.18),transparent_40%)]" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <p className="inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-1 text-sm font-medium text-cyan-200 mb-6">
            Inventory control made simple
          </p>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-4 tracking-tight">
            Stock Manager
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Track products, stock, and reviews from one clean dashboard.
          </p>
          <Link
            to="/products"
            className="inline-block bg-cyan-400 text-slate-950 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-cyan-300 transition-colors"
          >
            Browse catalog
          </Link>
        </div>
      </section>

      {/* Categorias */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Categories</h2>
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
              Featured products
            </h2>
            <Link
              to="/products"
              className="text-blue-600 hover:underline"
            >
              View all
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
