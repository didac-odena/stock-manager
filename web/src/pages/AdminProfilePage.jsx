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
      setApiError(error.response?.data?.message || "Error updating profile");
    }
  }

  return (
    <div className="max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h1 className="text-2xl font-bold text-white mb-6">My profile</h1>

      <div className="mb-6">
        <p className="text-sm text-slate-400">Email</p>
        <p className="text-slate-100">{user?.email}</p>
      </div>

      {apiError && (
        <div className="bg-rose-900/30 border border-rose-700 text-rose-200 p-3 rounded mb-4 text-sm">
          {apiError}
        </div>
      )}

      {success && (
        <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-200 p-3 rounded mb-4 text-sm">
          Profile updated successfully
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-cyan-400 text-slate-950 px-6 py-2 rounded-lg font-semibold hover:bg-cyan-300 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

export default AdminProfilePage;
