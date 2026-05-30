import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});
// Request interceptor to attach Bearer token if it exists in localStorage
client.interceptors.request.use((config) => {
  const isAdminRoute = typeof window !== "undefined" && window.location.pathname.startsWith('/admin');
  const token = typeof window !== "undefined"
    ? (isAdminRoute ? localStorage.getItem("admin_token") : localStorage.getItem("player_token"))
    : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors globally if needed (e.g. JWT expiry)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth-failure"));
      }
    }
    return Promise.reject(error);
  },
);

export default client;
