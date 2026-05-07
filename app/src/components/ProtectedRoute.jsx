// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // 1. If no token, send to Login
  if (!token) {
    // We save the 'from' location so we can redirect back after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  try {
    const decoded = jwtDecode(token);

    // 2. CHECK EXPIRATION (Optional but Recommended)
    // jwt-decode gives 'exp' in seconds. Date.now() is in milliseconds.
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      localStorage.removeItem("token");
      return <Navigate to="/?reason=expired" replace />;
    }

    // 3. ROLE VALIDATION
    // If a superadmin route is accessed by a standard admin
    if (requiredRole && decoded.role !== requiredRole) {
      console.warn(`Access Denied: Required ${requiredRole}, found ${decoded.role}`);
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  } catch (error) {
    // If token is malformed
    localStorage.removeItem("token");
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;