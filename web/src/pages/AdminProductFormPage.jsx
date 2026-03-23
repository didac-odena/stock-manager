import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { getProduct, createProduct, updateProduct } from "../services/products.service";
import { useZxing } from "react-zxing";
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [scannerError, setScannerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const { ref } = useZxing({
    paused: !isScannerOpen,
    onDecodeResult(result) {
      const code = result.getText();
      if (!code || code === lastScannedCode) return;
      setLastScannedCode(code);
      setValue("barcode", code, { shouldDirty: true });
      setIsScannerOpen(false);
      setScannerError("");
    },
    onError() {
      setScannerError("Could not access the camera.");
    },
  });

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
      setApiError("Maximum 3 images");
      return;
    }
    setSelectedFiles(files);
  }

  function handleOpenScanner() {
    setScannerError("");
    setIsScannerOpen(true);
  }

  function handleScanAgain() {
    setLastScannedCode("");
    setScannerError("");
    setIsScannerOpen(true);
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
      setApiError(error.response?.data?.message || "Error saving product");
    }
  }

  return (
    <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        {isEditing ? "Edit product" : "Create product"}
      </h1>

      {apiError && (
        <div className="bg-rose-900/30 border border-rose-700 text-rose-200 p-3 rounded mb-4 text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Name
          </label>
          <input
            type="text"
            className="w-full border border-slate-700 bg-slate-950 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="text-rose-300 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Descripcion */}
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Description
          </label>
          <textarea
            rows={4}
            className="w-full border border-slate-700 bg-slate-950 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            {...register("description")}
          />
        </div>

        {/* Precio y Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Price (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-slate-700 bg-slate-950 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              {...register("price", {
                required: "Price is required",
                min: { value: 0, message: "Price cannot be negative" },
              })}
            />
            {errors.price && (
              <p className="text-rose-300 text-sm mt-1">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Stock
            </label>
            <input
              type="number"
              min="0"
              className="w-full border border-slate-700 bg-slate-950 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              {...register("stock", {
                required: "Stock is required",
                min: { value: 0, message: "Stock cannot be negative" },
              })}
            />
            {errors.stock && (
              <p className="text-rose-300 text-sm mt-1">{errors.stock.message}</p>
            )}
          </div>
        </div>

        {/* Barcode (opcional) */}
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Barcode <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="w-full border border-slate-700 bg-slate-950 text-slate-100 rounded-lg px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              placeholder="e.g.: 1234567890123"
              {...register("barcode")}
            />
            <button
              type="button"
              onClick={handleOpenScanner}
              className="whitespace-nowrap bg-slate-800 border border-slate-700 text-slate-100 px-4 py-2 rounded-lg hover:bg-slate-700"
            >
              Scan barcode
            </button>
          </div>

          {scannerError && (
            <p className="text-rose-300 text-sm mt-2">{scannerError}</p>
          )}

          {isScannerOpen && (
            <div className="mt-3">
              <p className="text-sm text-slate-300 mb-2">
                Point the camera at the barcode.
              </p>
              <div className="rounded-lg overflow-hidden border border-slate-700 bg-black">
                <video ref={ref} className="w-full max-h-72 object-cover" />
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(false)}
                className="mt-2 text-sm text-slate-300 hover:text-white"
              >
                Close scanner
              </button>
            </div>
          )}

          {!isScannerOpen && lastScannedCode && (
            <button
              type="button"
              onClick={handleScanAgain}
              className="mt-2 text-sm text-cyan-300 hover:underline"
            >
              Scan again
            </button>
          )}
        </div>

        {/* Categorias (checkboxes) */}
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">
            Categories
          </label>
          <div className="flex flex-wrap gap-3">
            {availableCategories.map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => handleCategoryChange(cat)}
                  className="rounded border-slate-600 bg-slate-950 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-sm text-slate-300">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Imagenes */}
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">
            Images (max. 3)
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
              <p className="text-xs text-slate-400 self-end">
                (they will be replaced if you upload new ones)
              </p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-slate-700 file:bg-slate-800 file:text-slate-100 hover:file:bg-slate-700"
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
            className="bg-cyan-400 text-slate-950 px-6 py-2 rounded-lg font-semibold hover:bg-cyan-300 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="bg-slate-800 border border-slate-700 text-slate-100 px-6 py-2 rounded-lg hover:bg-slate-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminProductFormPage;
