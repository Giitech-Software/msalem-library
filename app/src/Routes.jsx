//app/src/Routes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute"; 

// Existing Pages
const HomePage = lazy(() => import("./pages/HomePage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const AddBookCatalog = lazy(() => import("./pages/AddBookCatalog"));
const BookCatalog = lazy(() => import("./pages/BookCatalog"));
const ActiveBooks = lazy(() => import("./pages/ActiveBooks"));
const BookBorrowForm = lazy(() => import("./pages/BookBorrowForm"));
const ArchivedBooks = lazy(() => import("./pages/ArchivedBooks"));
const Statistics = lazy(() => import("./pages/Statistics"));
const OverdueBooks = lazy(() => import("./pages/OverdueBooks"));
const StudentList = lazy(() => import("./pages/StudentList"));
const StaffList = lazy(() => import("./pages/StaffList"));
const AdminManagement = lazy(() => import("./pages/AdminManagement"));
const SecurityLogs = lazy(() => import("./pages/SecurityLogs"));
const GeneralUserList = lazy(() => import("./pages/GeneralUserList"));

// ✅ NEW: Import the Financial Vault Page
const SuperAdminFinance = lazy(() => import("./pages/SuperAdminFinance"));

// ✅ NEW: Import the User Manual Page
const UserManual = lazy(() => import("./pages/UserManual"));

const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-yellow-50 flex items-center justify-center text-green-800 font-black animate-pulse">Loading page...</div>}>
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
      <Route path="/user-manual" element={<ProtectedRoute><UserManual /></ProtectedRoute>} />
      {/* People Management */}
      <Route path="/students" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><StaffList /></ProtectedRoute>} />
      <Route path="/general-users" element={<ProtectedRoute><GeneralUserList /></ProtectedRoute>} />

      {/* 🛡️ Superadmin ONLY Pages */}
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

      {/* ✅ NEW: Superadmin Financial Vault Route */}
      <Route 
        path="/financial-vault" 
        element={
          <ProtectedRoute requiredRole="superadmin">
            <SuperAdminFinance />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
