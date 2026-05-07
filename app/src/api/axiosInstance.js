import axios from "axios";

const API = axios.create({
  // Using 127.0.0.1 is best for local Electron-to-Node communication
  baseURL: "http://127.0.0.1:5000/api",
  timeout: 60000,
});

// REQUEST INTERCEPTOR: Attach the Admin Token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// RESPONSE INTERCEPTOR: Global Error Handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    // 401: Token expired/invalid. 403 should not always log users out:
    // it can also mean a valid admin clicked a superadmin-only page.
    const shouldEndSession = response && (
      response.status === 401 ||
      (response.status === 403 && /suspended|not found/i.test(response.data?.message || ""))
    );

    if (shouldEndSession) {
      localStorage.removeItem("token");
      localStorage.removeItem("adminInfo"); // Clean up any stored profile data
      
      const reason = response.status === 403 ? "suspended" : "expired";
      
      // Prevent infinite redirect loops if already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = `/login?reason=${reason}`;
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;
