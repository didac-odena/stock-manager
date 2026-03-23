import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getProduct } from "../services/products.service";
import { getReviews, createReview } from "../services/reviews.service";
import { useAuth } from "../contexts/auth.context";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    Promise.all([getProduct(id), getReviews(id)])
      .then(([productData, reviewsData]) => {
        setProduct(productData);
        setReviews(reviewsData);
        setSelectedImage(0);
      })
      .catch(() => navigate("/products"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess(false);

    try {
      const newReview = await createReview(id, { email: reviewEmail, rating: reviewRating });
      setReviews((prev) => [newReview, ...prev]);
      setReviewEmail("");
      setReviewRating(0);
      setReviewSuccess(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setReviewError("You already reviewed this product with that email.");
      } else {
        setReviewError("Error submitting the review. Please try again.");
      }
    }
  }

  if (!product) return null;

  const images = product.images.length > 0 ? product.images : ["/placeholder-product.png"];

  const isAvailable = product.stock > 0;
  const stockBadgeClass = product.stock === 0
    ? "bg-red-100 text-red-800"
    : product.stock < 5
      ? "bg-yellow-100 text-yellow-800"
      : "bg-green-100 text-green-800";
  const reviewsCount = reviews.length;
  const averageRating = reviewsCount > 0
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviewsCount).toFixed(1)
    : "0.0";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Boton volver */}
      <Link to="/products" className="inline-flex items-center text-blue-600 hover:underline mb-6">
        &larr; Back to catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galeria de imagenes */}
        <div>
          {/* Imagen principal */}
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Miniaturas (solo si hay mas de 1 imagen) */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index
                      ? "border-blue-600"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informacion del producto */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {product.categories.map((cat) => (
                <Link
                  key={cat}
                  to={`/products?category=${encodeURIComponent(cat)}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">{product.price.toFixed(2)} EUR</span>
          </div>

          <div className="mt-4">
            {user ? (
              <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${stockBadgeClass}`}>
                Stock: {product.stock} units
              </span>
            ) : (
              isAvailable ? (
                <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  Available
                </span>
              ) : (
                <span className="inline-block bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                  Out of stock
                </span>
              )
            )}
          </div>

          {product.description && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>
      {/* Seccion de reviews */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews</h2>
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Average: <span className="font-semibold text-gray-900">{averageRating}/5</span>
            {" · "}
            <span>
              {reviewsCount} {reviewsCount === 1 ? "rating" : "ratings"}
            </span>
          </p>
        </div>

        {/* Formulario nueva review */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Leave your review</h3>
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Your email"
              value={reviewEmail}
              onChange={(e) => setReviewEmail(e.target.value)}
              required
              className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Selector de estrellas */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className={`text-2xl ${star <= reviewRating ? "text-yellow-400" : "text-gray-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
            {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}
            {reviewSuccess && (
              <p className="text-green-600 text-sm">Review submitted. Thanks!</p>
            )}
            <button
              type="submit"
              disabled={!reviewEmail || reviewRating === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit review
            </button>
          </form>
        </div>

        {/* Lista de reviews */}
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet for this product.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-yellow-400">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                  <span className="text-sm text-gray-500">{review.email}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;
