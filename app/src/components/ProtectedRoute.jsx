import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Make sure to npm install jwt-decode in frontend

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("token");

  // 1. If no token, send to Login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    // 2. If a specific role is required (like superadmin) but user doesn't have it
    if (requiredRole && decoded.role !== requiredRole) {
      console.warn("Unauthorized access attempt to:", requiredRole);
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  } catch (error) {
    // If token is malformed or invalid
    localStorage.removeItem("token");
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;