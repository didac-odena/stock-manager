import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

http.interceptors.response.use((response) => response.data);

export function getProducts(params = {}) {
  return http.get("/products", { params });
}

export function getProduct(id) {
  return http.get(`/products/${id}`);
}

export function createProduct(formData) {
  return http.post("/products", formData);
}

export function updateProduct(id, formData) {
  return http.patch(`/products/${id}`, formData);
}

export function deleteProduct(id) {
  return http.delete(`/products/${id}`);
}