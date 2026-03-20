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