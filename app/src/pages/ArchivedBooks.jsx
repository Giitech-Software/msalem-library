import React, { useEffect, useState } from "react";
import axios from "axios";
import BackButton from "../components/BackButton"; // Adjust path based on your folder structure

const ArchivedBooks = () => {
  const [archivedBooks, setArchivedBooks] = useState([]);

  useEffect(() => {
    fetchArchivedBooks();
    // eslint-disable-next-line
  }, []);

  const fetchArchivedBooks = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/books/archived", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      setArchivedBooks(response.data);
    } catch (error) {
      console.error("Failed to fetch archived books:", error);
    }
  };

  const handleDelete = async (id) => {
    const email = prompt("Enter your admin email:");
    const password = prompt("Enter your admin password:");
    if (!email || !password) {
      alert("Email and password are required to delete.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to permanently delete this record?");
    if (!confirmed) return;

    try {
      await axios.post(
        `http://localhost:5000/api/books/delete/${id}`,
        { email, password },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );
      // Refresh list after deletion
      fetchArchivedBooks();
    } catch (error) {
      console.error("Failed to delete archived book:", error);
      alert(
        error.response?.data?.message ||
          "Failed to delete book. Please check your credentials."
      );
    }
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen">
       <BackButton label="⬅ Return to Dashboard" />
      <h1 className="text-3xl font-extrabold text-green-700 mb-4 text-center">🗂️📕 Archived Books</h1>

      <div className="overflow-x-auto shadow-lg rounded-xl bg-white p-6">
        <table className="w-full text-left border-collapse">
         <thead>
  <tr className="bg-green-600 text-yellow-300">
    <th className="py-2 px-3">Title</th>
    <th className="py-2 px-3">Borrower</th>
    <th className="py-2 px-3">Category</th>
    <th className="py-2 px-3">Sub Category</th>
    <th className="py-2 px-3">Borrowed Date</th>
    <th className="py-2 px-3">Return Date</th>
    <th className="py-2 px-3">Actions</th>
  </tr>
</thead>

<tbody>
  {archivedBooks.map((book) => (
    <tr key={book._id} className="border-b hover:bg-yellow-100">
      <td className="py-2 px-3">{book.title}</td>
      <td className="py-2 px-3">{book.borrowerName}</td>
      <td className="py-2 px-3">{book.category}</td>
      <td className="py-2 px-3">{book.subCategory}</td>
      <td className="py-2 px-3">
        {new Date(book.borrowedDate).toLocaleDateString()}
      </td>
      <td className="py-2 px-3">
        {new Date(book.returnDate).toLocaleDateString()}
      </td>
      <td className="py-2 px-3">
        <button
          onClick={() => handleDelete(book._id)}
          className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600"
        >
          Delete
        </button>
      </td>
    </tr>
  ))}

  {archivedBooks.length === 0 && (
    <tr>
      <td colSpan="7" className="text-center py-8 text-gray-500">
        No archived books available.
      </td>
    </tr>
  )}
</tbody>
        </table>
      </div>
    </div>
  );
};

export default ArchivedBooks;
