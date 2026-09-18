//src/api/axios.ts
import axios from "axios";

export const api = axios.create({
  // baseURL: "https://divolca-backend.onrender.com/api",
  baseURL: "http://localhost:3005/api",
  withCredentials: true,
});

// ---------- REQUEST: attach access token ----------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- RESPONSE: auto-refresh on 401 ----------
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

// Bare axios instance for the refresh call — must NOT go through this interceptor
const bareAxios = axios.create({
  baseURL: "http://localhost:3005/api",
  withCredentials: true,
});

const AUTH_REFRESH_URL = "/auth/refresh";

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only handle 401s, and only once per request
    if (
      error?.response?.status !== 401 ||
      original?._retry ||
      original?.url?.includes(AUTH_REFRESH_URL) ||
      original?.url?.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (token) {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          } else {
            reject(error);
          }
        });
      });
    }

    isRefreshing = true;

    try {
      // ✅ Call refresh using the bare axios instance
      const { data } = await bareAxios.post(AUTH_REFRESH_URL);

      const newToken = data.accessToken;
      localStorage.setItem("token", newToken);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Drain the queue
      pendingQueue.forEach((cb) => cb(newToken));
      pendingQueue = [];

      // Retry the original request
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      // Refresh failed → hard logout
      pendingQueue.forEach((cb) => cb(null));
      pendingQueue = [];

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);