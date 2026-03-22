import { useState } from "react";
import { Link } from "react-router-dom";
import { useZxing } from "react-zxing";
import { getProductByBarcode } from "../services/products.service";

function AdminBarcodePage() {
  const [scanning, setScanning] = useState(true);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [lastCode, setLastCode] = useState("");

  const { ref } = useZxing({
    paused: !scanning,
    onDecodeResult(result) {
      const code = result.getText();

      // Evitar procesar el mismo codigo repetidamente
      if (code === lastCode) return;
      setLastCode(code);
      setScanning(false);

      handleBarcode(code);
    },
  });

  async function handleBarcode(code) {
    try {
      setError("");
      setProduct(null);
      const found = await getProductByBarcode(code);
      setProduct(found);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`No se encontro ningun producto con el codigo: ${code}`);
      } else {
        setError("Error al buscar el producto");
      }
    }
  }

  function handleReset() {
    setScanning(true);
    setProduct(null);
    setError("");
    setLastCode("");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Escaner de barcode
      </h1>

      {/* Camara */}
      {scanning && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">
            Apunta la camara al codigo de barras del producto.
          </p>
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
            <video ref={ref} className="w-full" />
          </div>
        </div>
      )}

      {/* Resultado */}
      {product && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex gap-4 items-start">
            {product.images.length > 0 && (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-20 h-20 rounded object-cover shrink-0"
              />
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {product.name}
              </h2>
              <p className="text-sm text-gray-500 mb-1">
                Categorias: {product.categories.join(", ") || "—"}
              </p>
              <p className="text-sm text-gray-500 mb-1">
                Stock: <span className={`font-medium ${product.stock === 0 ? "text-red-500" : "text-gray-900"}`}>{product.stock}</span>
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Precio: <span className="font-medium text-gray-900">{product.price.toFixed(2)} EUR</span>
              </p>
              <Link
                to={`/admin/products/${product.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 inline-block"
              >
                Editar producto
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Boton para volver a escanear */}
      {!scanning && (
        <button
          onClick={handleReset}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          Escanear otro
        </button>
      )}
    </div>
  );
}

export default AdminBarcodePage;