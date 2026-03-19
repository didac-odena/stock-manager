import axios from "axios";

const http = axios.create({ baseURL: "/api", withCredentials: true });

http.interceptors.response.use((response) => response.data);

export function login(email, password) {
  return http.post("/login", { email, password });
}

export function register(data) {
  return http.post("/register", data);
}

export function logout() {
  return http.post("/logout");
}

export function getProfile() {
  return http.get("/me");
}

export function updateProfile(data) {
  return http.patch("/me", data);
}

export function createInvitation() {
  return http.post("/invitations");
}
