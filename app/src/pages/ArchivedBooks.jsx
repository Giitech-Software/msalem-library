import React, { useEffect, useState } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

const ArchivedBooks = () => {
  const [archivedBooks, setArchivedBooks] = useState([]);
  const [search, setSearch] = useState(""); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [adminAuth, setAdminAuth] = useState({ email: "", password: "" });

  useEffect(() => {
    fetchArchivedBooks();
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

  const filteredBooks = archivedBooks.filter(
    (book) =>
      book.borrowerName?.toLowerCase().includes(search.toLowerCase()) ||
      book.title?.toLowerCase().includes(search.toLowerCase()) ||
      book.borrowerId?.toLowerCase().includes(search.toLowerCase())
  );

  const openDeleteModal = (id) => {
    setSelectedBookId(id);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setSelectedBookId(null);
    setAdminAuth({ email: "", password: "" });
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `http://localhost:5000/api/books/delete/${selectedBookId}`,
        { email: adminAuth.email, password: adminAuth.password },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );
      fetchArchivedBooks();
      closeDeleteModal();
    } catch (error) {
      alert(error.response?.data?.message || "Authentication failed.");
    }
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen border-2 border-yellow-200 relative font-sans">
      <BackButton label="⬅ Return to Dashboard" />
      
      {/* Updated Header and Search Container */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-black text-green-700 uppercase tracking-tight italic">
          🗂️📕 Archived Records
        </h1>

        <div className="w-full max-w-xs">
          <input
            type="text"
            placeholder="Search archives..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-2 border-green-200 p-2 rounded-xl focus:border-green-600 outline-none shadow-sm font-bold text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto shadow-2xl rounded-2xl bg-white p-2 border-2 border-yellow-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800 text-yellow-400 uppercase text-xs tracking-widest">
              <th className="py-2 px-4 border-b border-gray-900">Borrower ID</th>
              <th className="py-2 px-4 border-b border-gray-900">Book Title</th>
              <th className="py-2 px-4 border-b border-gray-900">Borrower Name</th>
              <th className="py-2 px-4 border-b border-gray-900">Category</th>
              <th className="py-2 px-4 border-b border-gray-900">Timeline</th>
              <th className="py-2 px-4 border-b border-gray-900 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBooks.map((book) => (
              <tr key={book._id} className="hover:bg-gray-50 transition-colors">
                <td className="py-0.5 px-4">
                  <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    {book.borrowerId || "NO-ID"}
                  </span>
                </td>
                <td className="py-0.5 px-4 font-black text-gray-800 text-sm">{book.title}</td>
                <td className="py-0.5 px-4 font-bold text-gray-700 text-sm">{book.borrowerName}</td>
                <td className="py-0.5 px-4 text-[10px] font-bold text-gray-400 uppercase leading-tight">
                  {book.category} <br/> {book.subCategory}
                </td>
                <td className="py-0.5 px-4 text-[11px] font-bold text-gray-500">
                  <div className="flex flex-col">
                    <span>Borrowed: {new Date(book.borrowedDate).toLocaleDateString()}</span>
                    <span className="text-green-600">Returned: {new Date(book.returnDate).toLocaleDateString()}</span>
                  </div>
                </td>
                <td className="py-0.5 px-4 text-center">
                  <button
                    onClick={() => openDeleteModal(book._id)}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] hover:bg-red-700 transition-all uppercase shadow-sm active:scale-95 tracking-tighter"
                  >
                    Delete Permanently
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Delete Confirmation Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-3 w-full max-w-md border-4 border-red-600">
            <h2 className="text-2xl font-black text-red-600 mb-2 uppercase">Security Check</h2>
            <p className="text-gray-600 mb-2 font-bold text-sm">This action is irreversible. Enter Admin credentials to delete this archive.</p>
            
            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <input
                type="email"
                placeholder="Admin Email"
                required
                className="w-full border-2 rounded-xl p-2 focus:border-red-600 outline-none font-bold"
                value={adminAuth.email}
                onChange={(e) => setAdminAuth({ ...adminAuth, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full border-2 rounded-xl p-2 focus:border-red-600 outline-none font-bold"
                value={adminAuth.password}
                onChange={(e) => setAdminAuth({ ...adminAuth, password: e.target.value })}
              />
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 px-2 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 font-black uppercase text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-2 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-black uppercase text-xs shadow-lg transition-transform active:scale-95"
                >
                  Confirm Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivedBooks;