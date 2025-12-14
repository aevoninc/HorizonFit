import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
   withCredentials: true,
});

// Attach token automatically
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// SAFE Response interceptor — prevents unwanted logout
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("accessToken");

      // If token exists → DO NOT logout immediately (user is still logged in)
      if (token) {
        console.warn("401 received but token exists — not logging out.");
        return Promise.reject(error);
      }

      // If token doesn't exist → user is actually logged out
      console.warn("401 + no token → redirecting to login.");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userSession");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;


