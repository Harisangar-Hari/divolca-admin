import axios from "axios";

export const api = axios.create({
  // baseURL: "https://pos-nest-k5pm.onrender.com/api",
  baseURL: "http://localhost:3005/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
