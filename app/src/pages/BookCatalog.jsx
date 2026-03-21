//app/src/pages/BookCatalog.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import BackButton from "../components/BackButton"; // Adjust path based on your folder structure

const BookCatalog = () => {
  const [catalog, setCatalog] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchCatalog();
    // eslint-disable-next-line
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bookCatalog");
      setCatalog(res.data);
    } catch (err) {
      console.error("Failed to fetch catalog:", err);
    }
  };

  const handleDelete = async (id) => {
  const email = prompt("Enter your admin email:");
  const password = prompt("Enter your admin password:");

  if (!email || !password) {
    alert("Email and password are required to delete.");
    return;
  }

  const confirmed = window.confirm(
    "⚠️ WARNING: This will permanently delete this book from the catalog.\nAre you absolutely sure?"
  );
  if (!confirmed) return;

  try {
    await axios.post(
      `http://localhost:5000/api/bookCatalog/delete/${id}`,
      { email, password },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      }
    );

    fetchCatalog();
  } catch (err) {
    console.error("Delete failed:", err);
    alert(
      err.response?.data?.message ||
      "Failed to delete. Invalid admin credentials."
    );
  }
};
  const handleEdit = (book) => {
    setEditing(book._id);
    setEditForm(book);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5000/api/bookCatalog/${editing}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );
      setEditing(null);
      fetchCatalog();
    } catch (err) {
      console.error("Edit failed:", err);
      alert("Failed to update. Please try again.");
    }
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" />{/* Include the BackButton component */}
      <h1 className="text-3xl font-extrabold text-green-700 mb-4 text-center"> 📘🧾Book Catalog</h1>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
  <tr className="bg-green-600 text-yellow-300">
    <th className="py-2 px-3">Title</th>
    <th className="py-2 px-3">Author</th>
    <th className="py-2 px-3">Category</th>
    <th className="py-2 px-3 text-right">Actions</th>
  </tr>
</thead>

<tbody>
  {catalog.map((book) => (
    <tr key={book._id} className="border-b hover:bg-yellow-100">
      {editing === book._id ? (
        <>
          <td className="py-2 px-3">
            <input
              name="title"
              value={editForm.title}
              onChange={handleEditChange}
              className="border p-1.5 rounded"
            />
          </td>
          <td className="py-2 px-3">
            <input
              name="author"
              value={editForm.author}
              onChange={handleEditChange}
              className="border p-1.5 rounded"
            />
          </td>
          <td className="py-2 px-3">
            <select
              name="category"
              value={editForm.category}
              onChange={handleEditChange}
              className="border p-1.5 rounded"
            >
              <option value="Textbook">Textbook</option>
              <option value="Storybook">Storybook</option>
            </select>
          </td>
          <td className="py-2 px-3 text-right">
            <button
              onClick={handleEditSubmit}
              className="bg-green-600 text-white py-1 px-3 rounded mr-2"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(null)}
              className="bg-gray-400 text-white py-1 px-3 rounded"
            >
              Cancel
            </button>
          </td>
        </>
      ) : (
        <>
          <td className="py-2 px-3">{book.title}</td>
          <td className="py-2 px-3">{book.author}</td>
          <td className="py-2 px-3">{book.category}</td>
          <td className="py-2 px-3 text-right">
            <button
              onClick={() => handleEdit(book)}
              className="bg-blue-500 text-white py-1 px-3 rounded mr-2"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(book._id)}
              className="bg-red-500 text-white py-1 px-3 rounded"
            >
              Delete
            </button>
          </td>
        </>
      )}
    </tr>
  ))}

  {catalog.length === 0 && (
    <tr>
      <td colSpan="4" className="text-center py-8 text-gray-500">
        No book titles found.
      </td>
    </tr>
  )}
</tbody>
        </table>
      </div>
    </div>
  );
};

export default BookCatalog;
