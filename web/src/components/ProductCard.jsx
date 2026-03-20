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