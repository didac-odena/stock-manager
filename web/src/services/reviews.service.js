import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

http.interceptors.response.use((response) => response.data);

export function getReviews(productId) {
  return http.get(`/products/${productId}/reviews`);
}

export function createReview(productId, data) {
  return http.post(`/products/${productId}/reviews`, data);
}
