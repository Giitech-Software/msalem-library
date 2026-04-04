import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute"; 

// Existing Pages
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AddBookCatalog from "./pages/AddBookCatalog";
import BookCatalog from "./pages/BookCatalog";
import ActiveBooks from "./pages/ActiveBooks";
import BookBorrowForm from "./pages/BookBorrowForm";
import ArchivedBooks from "./pages/ArchivedBooks";
import Statistics from "./pages/Statistics";
import OverdueBooks from "./pages/OverdueBooks";
import StudentList from "./pages/StudentList";
import StaffList from "./pages/StaffList";
import AdminManagement from "./pages/AdminManagement"; 

// ✅ New Page - Ensure this file exists at /src/pages/SecurityLogs.jsx
import SecurityLogs from "./pages/SecurityLogs"; 

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />

      {/* Standard Admin Pages (Need Token) */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/active-books" element={<ProtectedRoute><ActiveBooks /></ProtectedRoute>} />
      <Route path="/add-book" element={<ProtectedRoute><BookBorrowForm /></ProtectedRoute>} />
      <Route path="/add-book-title" element={<ProtectedRoute><AddBookCatalog /></ProtectedRoute>} />
      <Route path="/archived-books" element={<ProtectedRoute><ArchivedBooks /></ProtectedRoute>} />
      <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
      <Route path="/overdue" element={<ProtectedRoute><OverdueBooks /></ProtectedRoute>} />
      <Route path="/book-catalog" element={<ProtectedRoute><BookCatalog /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><StaffList /></ProtectedRoute>} />

      {/* ✅ Superadmin ONLY Pages */}
      <Route 
        path="/admin-management" 
        element={
          <ProtectedRoute requiredRole="superadmin">
            <AdminManagement />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/security-logs" 
        element={
          <ProtectedRoute requiredRole="superadmin">
            <SecurityLogs />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;