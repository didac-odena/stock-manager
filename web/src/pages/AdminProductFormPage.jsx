import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { getProduct, createProduct, updateProduct } from "../services/products.service";
import { getCategories } from "../services/categories.service";

function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Cargar categorias disponibles
  useEffect(() => {
    getCategories().then(setAvailableCategories).catch(console.error);
  }, []);

  // Si estamos editando, cargar el producto
  useEffect(() => {
    if (isEditing) {
      getProduct(id)
        .then((product) => {
          reset({
            name: product.name,
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            barcode: product.barcode || "",
          });
          setSelectedCategories(product.categories || []);
          setCurrentImages(product.images || []);
        })
        .catch(() => navigate("/admin/products"));
    }
  }, [id, isEditing, reset, navigate]);

  function handleCategoryChange(category) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      setApiError("Maximo 3 imagenes");
      return;
    }
    setSelectedFiles(files);
  }

  async function onSubmit(data) {
    try {
      setApiError("");

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("price", data.price);
      formData.append("stock", data.stock);

      if (data.barcode) {
        formData.append("barcode", data.barcode);
      }

      // Categorias: una llamada append por elemento
      selectedCategories.forEach((cat) => {
        formData.append("categories", cat);
      });

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      if (isEditing) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }

      navigate("/admin/products");
    } catch (error) {
      setApiError(error.response?.data?.message || "Error al guardar producto");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? "Editar producto" : "Crear producto"}
      </h1>

      {apiError && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("name", { required: "El nombre es obligatorio" })}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Descripcion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripcion
          </label>
          <textarea
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("description")}
          />
        </div>

        {/* Precio y Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("price", {
                required: "El precio es obligatorio",
                min: { value: 0, message: "El precio no puede ser negativo" },
              })}
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock
            </label>
            <input
              type="number"
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("stock", {
                required: "El stock es obligatorio",
                min: { value: 0, message: "El stock no puede ser negativo" },
              })}
            />
            {errors.stock && (
              <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
            )}
          </div>
        </div>

        {/* Barcode (opcional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Codigo de barras <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 1234567890123"
            {...register("barcode")}
          />
        </div>

        {/* Categorias (checkboxes) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categorias
          </label>
          <div className="flex flex-wrap gap-3">
            {availableCategories.map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => handleCategoryChange(cat)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Imagenes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imagenes (max. 3)
          </label>

          {/* Imagenes actuales (solo en edicion) */}
          {isEditing && currentImages.length > 0 && (
            <div className="flex gap-2 mb-2">
              {currentImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Actual ${index + 1}`}
                  className="w-20 h-20 rounded object-cover border"
                />
              ))}
              <p className="text-xs text-gray-500 self-end">
                (se reemplazaran si subes nuevas)
              </p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {/* Preview de archivos seleccionados */}
          {selectedFiles.length > 0 && (
            <div className="flex gap-2 mt-2">
              {selectedFiles.map((file, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 rounded object-cover border"
                />
              ))}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminProductFormPage;