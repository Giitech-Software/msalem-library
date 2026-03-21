// app/src/pages/OverdueBooks.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import BackButton from "../components/BackButton"; // Adjust path based on your folder structure

const OverdueBooks = () => {
  const [overdueBooks, setOverdueBooks] = useState([]);

  useEffect(() => {
    fetchOverdue();
  }, []);

  const fetchOverdue = async () => {
    const res = await axios.get("http://localhost:5000/api/books/overdue");
    setOverdueBooks(res.data);
  };

  // PDF export function
  const handleExportPDF = () => {
    // Direct download by opening in a new tab
    window.open("http://localhost:5000/api/books/reports/overdue-books/pdf", "_blank");
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" /> {/* Include the BackButton component */}
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h1 className="text-3xl font-extrabold text-green-700 mb-2 md:mb-0 text-center md:text-left">
          ⏰📕 Overdue Books
        </h1>

        <button
          onClick={handleExportPDF}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition"
        >
          Export PDF
        </button>
      </div>

      {overdueBooks.length === 0 ? (
        <p className="text-center text-lg text-gray-600">No overdue books at the moment.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {overdueBooks.map((book) => (
            <div
              key={book._id}
              className="bg-white shadow-lg p-6 rounded-xl border-t-4 border-red-500"
            >
              <h2 className="text-xl font-bold text-green-700 mb-2">{book.title}</h2>
              <p><strong>Borrower:</strong> {book.borrowerName}</p>
              <p><strong>Borrowed Date:</strong> {new Date(book.borrowedDate).toLocaleDateString()}</p>
              <p><strong>Return Date:</strong> {new Date(book.returnDate).toLocaleDateString()}</p>
              <p className="text-red-600 font-semibold mt-2">⚠ Overdue!</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OverdueBooks;