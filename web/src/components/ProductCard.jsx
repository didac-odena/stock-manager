import { Link } from "react-router-dom";
import { useAuth } from "../contexts/auth.context";

function ProductCard({ product }) {
  const { user } = useAuth();

  const imageUrl = product.images.length > 0
    ? product.images[0]
    : "/placeholder-product.png";

  const isAvailable = product.stock > 0;
  const stockLabel = user
    ? `Stock: ${product.stock}`
    : isAvailable
      ? "Disponible"
      : "Agotado";

  const stockLabelClass = user
    ? product.stock === 0
      ? "text-red-500"
      : product.stock < 5
        ? "text-yellow-600"
        : "text-gray-600"
    : isAvailable
      ? "text-green-600"
      : "text-red-500";

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
          <span className={`text-sm font-medium ${stockLabelClass}`}>
            {stockLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
