import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts, deleteProduct } from "../services/products.service";
import SearchInput from "../components/SearchInput";

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadProductsList() {
    const params = { page, limit: 10 };
    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch) {
      params.search = trimmedSearch;
    }

    getProducts(params)
      .then((response) => {
        setProducts(response.data);
        setMeta(response.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      loadProductsList();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, searchTerm]);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      setError("");
      await deleteProduct(id);
      setLoading(true);
      loadProductsList();
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting product");
    }
  }

  function handlePreviousPage() {
    setLoading(true);
    setPage((currentPage) => Math.max(1, currentPage - 1));
  }

  function handleNextPage() {
    if (!meta) return;
    setLoading(true);
    setPage((currentPage) => Math.min(meta.totalPages, currentPage + 1));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">
          Products {meta && `(${meta.total})`}
        </h1>
        <Link
          to="/admin/products/new"
          className="bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg font-semibold hover:bg-cyan-300"
        >
          + Product
        </Link>
      </div>

      <div className="mb-6">
        <SearchInput
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
        />
      </div>

      {error && (
        <div className="bg-rose-900/30 border border-rose-700 text-rose-200 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-300">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-300 mb-4">No products yet</p>
          <Link
            to="/admin/products/new"
            className="text-cyan-300 hover:underline"
          >
            Create the first one
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">
                    Product
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">
                    Categories
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">
                    Stock
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">
                    Price
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.map((product) => {
                  const imageUrl = product.images.length > 0
                    ? product.images[0]
                    : "/placeholder-product.png";

                  return (
                    <tr key={product.id} className="hover:bg-slate-800/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <span className="font-medium text-slate-100">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {product.categories.join(", ") || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            product.stock === 0
                              ? "text-red-500"
                              : product.stock < 5
                              ? "text-yellow-600"
                              : "text-slate-100"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-100">
                        {product.price.toFixed(2)} EUR
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="text-cyan-300 hover:text-cyan-200 text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-rose-400 hover:text-rose-300 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginacion */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={handlePreviousPage}
                disabled={page <= 1}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-slate-300 text-sm">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminProductsPage;
