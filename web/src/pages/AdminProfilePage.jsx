import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/auth.context";
import { updateProfile } from "../services/auth.service";

function AdminProfilePage() {
  const { user } = useAuth();
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordApiError, setPasswordApiError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: {
      errors: passwordErrors,
      isSubmitting: isPasswordSubmitting,
    },
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
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

  async function onPasswordSubmit(data) {
    try {
      setPasswordApiError("");
      setPasswordSuccess(false);
      await updateProfile({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess(true);
      resetPasswordForm();
    } catch (error) {
      setPasswordApiError(
        error.response?.data?.message ||
          error.response?.data?.error?.password?.message ||
          "Error updating password",
      );
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
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

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Change password</h2>

        {passwordApiError && (
          <div className="bg-rose-900/30 border border-rose-700 text-rose-200 p-3 rounded mb-4 text-sm">
            {passwordApiError}
          </div>
        )}

        {passwordSuccess && (
          <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-200 p-3 rounded mb-4 text-sm">
            Password updated successfully
          </div>
        )}

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Current password
            </label>
            <input
              type="password"
              className="w-full border border-slate-700 bg-slate-950 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              {...registerPassword("currentPassword", {
                required: "Current password is required",
              })}
            />
            {passwordErrors.currentPassword && (
              <p className="text-rose-300 text-sm mt-1">
                {passwordErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              New password
            </label>
            <input
              type="password"
              className="w-full border border-slate-700 bg-slate-950 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              {...registerPassword("newPassword", {
                required: "New password is required",
              })}
            />
            {passwordErrors.newPassword && (
              <p className="text-rose-300 text-sm mt-1">
                {passwordErrors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              className="w-full border border-slate-700 bg-slate-950 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              {...registerPassword("confirmNewPassword", {
                required: "Please confirm the new password",
                validate: (value, formValues) =>
                  value === formValues.newPassword || "Passwords do not match",
              })}
            />
            {passwordErrors.confirmNewPassword && (
              <p className="text-rose-300 text-sm mt-1">
                {passwordErrors.confirmNewPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPasswordSubmitting}
            className="bg-cyan-400 text-slate-950 px-6 py-2 rounded-lg font-semibold hover:bg-cyan-300 disabled:opacity-50"
          >
            {isPasswordSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminProfilePage;
