import {api} from "../api/axios";

// Login → Receives AccessToken as cookie + user data
export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data; // user info
};

// Refresh Access Token → Uses refreshToken cookie
export const refreshToken = async () => {
  const res = await api.get("/auth/refresh-token");
  return res.data;
};

// Logout → Clears cookies
export const logout = async () => {
  const res = await api.post("/auth/logout");
  return res.data;
};
