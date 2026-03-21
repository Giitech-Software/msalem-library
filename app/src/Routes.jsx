import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
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

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />

      {/* Admin Pages */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/active-books" element={<ActiveBooks />} />
      <Route path="/add-book" element={<BookBorrowForm />} />
      <Route path="/add-book-title" element={<AddBookCatalog />} />
      <Route path="/archived-books" element={<ArchivedBooks />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/overdue" element={<OverdueBooks />} />
      <Route path="/book-catalog" element={<BookCatalog />} />
<Route path="/students" element={<StudentList />} />
<Route path="/staff" element={<StaffList />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;