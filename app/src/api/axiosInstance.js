import axios from "axios";

// Create a custom version of axios
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// This part automatically adds your token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// This part catches the "Expired Token" error globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 means the token is dead or invalid
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token"); // Clean up
      
      // Redirect to login with a "reason" in the URL
      window.location.href = "/login?reason=expired";
    }
    return Promise.reject(error);
  }
);

export default API;