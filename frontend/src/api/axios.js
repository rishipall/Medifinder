import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Auto-attach JWT token to every request (supports vendor token & adminToken)
API.interceptors.request.use((req) => {
  const adminToken = localStorage.getItem("adminToken");
  const token = localStorage.getItem("token");
  if (adminToken && req.url.includes("/admin")) {
    req.headers.Authorization = `Bearer ${adminToken}`;
  } else if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});


// Response interceptor to catch single session invalidation
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401 && err.response.data?.singleSessionLogout) {
      localStorage.removeItem("token");
      localStorage.removeItem("vendor");
      alert("Session Expired: Your vendor account was logged in on another device.");
      window.location.href = "/vendor/login";
    }
    return Promise.reject(err);
  }
);

export default API;
