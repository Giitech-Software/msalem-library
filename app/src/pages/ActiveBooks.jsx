import React, { useEffect, useState } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

const ActiveBorrowedBooks = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState({ show: false, message: "", type: "" });
  
  // ELECTRON FIXES
  const [tableSession, setTableSession] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [adminCreds, setAdminCreds] = useState({ email: "", password: "" });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/books/active", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      setBooks(response.data);
      setTableSession(prev => prev + 1);
    } catch (error) {
      console.error("Failed to fetch books:", error);
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
      book.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleReturn = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/books/return/${id}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      setStatus({ show: true, message: "Book marked as returned!", type: "success" });
      fetchBooks();
      setTimeout(() => setStatus({ show: false }), 3000);
    } catch (error) {
      setStatus({ show: true, message: "Return failed.", type: "error" });
    }
  };

  const handleConfirmDelete = async (id) => {
    try {
      await axios.post(
        `http://localhost:5000/api/books/delete/${id}`,
        adminCreds,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
        }
      );
      setDeletingId(null);
      setAdminCreds({ email: "", password: "" });
      setStatus({ show: true, message: "Record deleted permanently.", type: "success" });
      fetchBooks();
      setTimeout(() => setStatus({ show: false }), 3000);
    } catch (error) {
      setStatus({ show: true, message: error.response?.data?.message || "Delete failed.", type: "error" });
    }
  };

  // ✅ NEW: EXPORT PDF FUNCTION
  const handleExportPDF = async () => {
    try {
      const response = await axios.get(
       "http://localhost:5000/api/books/reports/active-books/pdf",
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "active-books.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export PDF.");
    }
  };

 return (
    <div className="p-8 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" />
      
      {status.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl ${
          status.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {status.message}
        </div>
      )}

      <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">
        📖✅ Active Borrowed Books
      </h1>

      {/* SEARCH AND EXPORT CONTAINER */}
      <div className="mb-6 flex flex-col md:flex-row justify-center items-center gap-4">
        <input
          key={`search-${tableSession}`}
          type="text"
          placeholder="Search by borrower or book title..."
          value={search}
          autoComplete="off"
          onChange={(e) => setSearch(e.target.value)}
          className="border-2 border-green-200 p-2 rounded-lg w-80 focus:border-green-600 outline-none shadow-sm"
        />
        
        <button
          onClick={handleExportPDF}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
        >
          📄 Export PDF
        </button>
      </div>

      <div className="overflow-x-auto shadow-lg rounded-xl bg-white p-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-green-600 text-yellow-400">
              <th className="py-2 px-3 border-b border-gray-300">Title/Borrower</th>
              <th className="py-2 px-3 border-b border-gray-300">Category</th>
              <th className="py-2 px-3 border-b border-gray-300">Dates</th>
              <th className="py-2 px-3 border-b border-gray-300 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredBooks.map((book) => (
              <React.Fragment key={book._id}>
                <tr className="hover:bg-yellow-50 border-b border-gray-200">
                  <td className="py-2 px-3">
                    <div className="font-semibold text-green-800">{book.title}</div>
                    <div className="text-gray-600">{book.borrowerName}</div>
                  </td>

                  <td className="py-2 px-3">
                    {book.category}
                    <br />
                    <span className="text-gray-400">{book.subCategory}</span>
                  </td>

                  <td className="py-2 px-3">
                    <b>Out:</b> {new Date(book.borrowedDate).toLocaleDateString()} <br />
                    <b>Due:</b> {new Date(book.returnDate).toLocaleDateString()}
                  </td>

                  <td className="py-2 px-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReturn(book._id)}
                        className="bg-green-600 text-white px-2 py-1 rounded text-sm font-bold hover:bg-green-700"
                      >
                        Return
                      </button>

                      <button
                        onClick={() => setDeletingId(deletingId === book._id ? null : book._id)}
                        className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-bold hover:bg-red-200"
                      >
                        {deletingId === book._id ? "Cancel" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>

                {deletingId === book._id && (
                  <tr className="bg-red-50 border-b border-red-200">
                    <td colSpan="4" className="p-3">
                      <div className="flex flex-wrap items-center gap-2 justify-center">
                        <span className="text-[11px] font-bold text-red-700 uppercase">
                          Admin Auth Required:
                        </span>

                        <input
                          type="email"
                          placeholder="Admin Email"
                          className="border border-gray-300 p-1 text-xs rounded w-36"
                          value={adminCreds.email}
                          onChange={(e) =>
                            setAdminCreds({ ...adminCreds, email: e.target.value })
                          }
                        />

                        <input
                          type="password"
                          placeholder="Password"
                          className="border border-gray-300 p-1 text-xs rounded w-36"
                          value={adminCreds.password}
                          onChange={(e) =>
                            setAdminCreds({ ...adminCreds, password: e.target.value })
                          }
                        />

                        <button
                          onClick={() => handleConfirmDelete(book._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActiveBorrowedBooks;