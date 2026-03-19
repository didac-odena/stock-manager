import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

http.interceptors.response.use((response) => response.data);

export function getCategories() {
  return http.get("/categories");
}
