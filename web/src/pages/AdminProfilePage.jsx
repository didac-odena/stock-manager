import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/auth.context";
import { updateProfile } from "../services/auth.service";

function AdminProfilePage() {
  const { user } = useAuth();
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
    },
  });

  async function onSubmit(data) {
    try {
      setApiError("");
      setSuccess(false);
      await updateProfile(data);
      setSuccess(true);
    } catch (error) {
      setApiError(error.response?.data?.message || "Error al actualizar perfil");
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>

      <div className="mb-6">
        <p className="text-sm text-gray-500">Email</p>
        <p className="text-gray-900">{user?.email}</p>
      </div>

      {apiError && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {apiError}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">
          Perfil actualizado correctamente
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

export default AdminProfilePage;