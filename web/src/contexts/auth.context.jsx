/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import * as AuthService from "../services/auth.service";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check whether there is an active session on mount.
  useEffect(() => {
    AuthService.getProfile()
      .then((userData) => setUser(userData))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const userData = await AuthService.login(email, password);
    setUser(userData);
    return userData;
  }

  async function register(data) {
    const userData = await AuthService.register(data);
    setUser(userData);
    return userData;
  }

  async function logout() {
    await AuthService.logout();
    setUser(null);
  }

  const value = { user, loading, login, register, logout };

  // Keep the app blocked until the initial session check finishes.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
