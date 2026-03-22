import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts, deleteProduct } from "../services/products.service";

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function fetchProducts(pageNum) {
    getProducts({ page: pageNum, limit: 10 })
      .then((response) => {
        setProducts(response.data);
        setMeta(response.meta);
      })
      .catch((err) => {
        console.error(err);
        setError("Error al cargar productos");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  async function handleDelete(id) {
    if (!window.confirm("Seguro que quieres eliminar este producto?")) return;

    try {
      setError("");
      await deleteProduct(id);
      setLoading(true);
      fetchProducts(page);
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar producto");
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
        <h1 className="text-2xl font-bold text-gray-900">
          Productos {meta && `(${meta.total})`}
        </h1>
        <Link
          to="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Producto
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando productos...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No hay productos todavia</p>
          <Link
            to="/admin/products/new"
            className="text-blue-600 hover:underline"
          >
            Crear el primero
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Producto
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Categorias
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Stock
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Precio
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => {
                  const imageUrl = product.images.length > 0
                    ? product.images[0]
                    : "/placeholder-product.png";

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <span className="font-medium text-gray-900">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.categories.join(", ") || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            product.stock === 0
                              ? "text-red-500"
                              : product.stock < 5
                              ? "text-yellow-600"
                              : "text-gray-900"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {product.price.toFixed(2)} EUR
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Eliminar
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
                className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-gray-600 text-sm">
                Pagina {meta.page} de {meta.totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AdminProductsPage;
