import axios from "axios";

const http = axios.create({ baseURL: "/api", withCredentials: true });

http.interceptors.response.use((response) => response.data);

export function login(email, password) {
  return http.post("/auth/login", { email, password });
}

export function register(data) {
  return http.post("/auth/register", data);
}

export function logout() {
  return http.post("/auth/logout");
}

export function getProfile() {
  return http.get("/auth/me");
}

export function updateProfile(data) {
  return http.patch("/auth/me", data);
}

export function createInvitation() {
  return http.post("/admin/invitations");
}