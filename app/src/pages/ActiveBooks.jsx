import React, { useEffect, useState } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

const ActiveBorrowedBooks = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState({ show: false, message: "", type: "" });
  
  // Modal State for Electron-friendly confirmation
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null });
  
  const [tableSession, setTableSession] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [adminCreds, setAdminCreds] = useState({ email: "", password: "" });

  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

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
      book.borrowerName?.toLowerCase().includes(search.toLowerCase()) ||
      book.title?.toLowerCase().includes(search.toLowerCase()) ||
      book.borrowerId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleReturn = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/books/return/${id}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      setStatus({ show: true, message: "Book marked as returned!", type: "success" });
      setConfirmModal({ show: false, id: null }); // Close modal
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
      setStatus({ show: true, message: "Failed to export PDF.", type: "error" });
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      setStatus({ show: true, message: "Please enter an email address.", type: "error" });
      return;
    }

    setShowEmailInput(false);
    setStatus({ show: true, message: "Sending email... please wait.", type: "success" });

    try {
      const response = await axios.get(
        `http://localhost:5000/api/books/reports/active-books/pdf?email=${emailAddress}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );
      
      setStatus({ show: true, message: response.data.message, type: "success" });
      setEmailAddress(""); 
      setTimeout(() => setStatus({ show: false }), 5000);
    } catch (error) {
      setStatus({ 
        show: true, 
        message: error.response?.data?.message || "Failed to send email.", 
        type: "error" 
      });
      setTimeout(() => setStatus({ show: false }), 5000);
    }
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen border-2 border-yellow-200 font-sans">
      <BackButton label="⬅ Return to Dashboard" />
      
      {/* Non-blocking Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border-4 border-green-600 animate-in zoom-in duration-200">
                <h3 className="text-xl font-black text-green-800 mb-2 uppercase">Confirm Return</h3>
                <p className="text-gray-600 font-bold mb-6">Are you sure you want to mark this book as returned to the library?</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleReturn(confirmModal.id)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-xl font-black uppercase hover:bg-green-700 transition-colors"
                    >Yes, Return</button>
                    <button 
                        onClick={() => setConfirmModal({ show: false, id: null })}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-black uppercase hover:bg-gray-300 transition-colors"
                    >Cancel</button>
                </div>
            </div>
        </div>
      )}

      {status.show && (
        <div className={`fixed top-4 right-4 z-50 p-2 rounded-lg shadow-xl flex items-center gap-4 transition-all ${
          status.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span className="font-bold">{status.message}</span>
          <button 
            onClick={() => setStatus({ show: false })}
            className="bg-black/20 hover:bg-black/40 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
          >✕</button>
        </div>
      )}

      {/* Aligned Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-black text-green-700 uppercase tracking-tight italic whitespace-nowrap">
          📖✅ Active Borrowed Books
        </h1>

        <div className="flex flex-wrap items-center justify-end gap-3 flex-1">
          <input
            key={`search-${tableSession}`}
            type="text"
            placeholder="Search by ID, Names or Title..."
            value={search}
            autoComplete="off"
            onChange={(e) => setSearch(e.target.value)}
            className="border-2 border-green-200 p-2 rounded-lg w-full max-w-70 focus:border-green-600 outline-none shadow-sm font-bold text-sm"
          />
          
          <div className="flex gap-2">
            <button onClick={handleExportPDF} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2 uppercase whitespace-nowrap">📄 PDF</button>
            <button onClick={() => setShowEmailInput(!showEmailInput)} className="bg-purple-600 text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2 uppercase whitespace-nowrap">📧 {showEmailInput ? "Cancel" : "Email"}</button>
          </div>
        </div>
      </div>

      {showEmailInput && (
        <div className="flex justify-end mb-4">
          <div className="flex gap-2 p-2 bg-white rounded-lg shadow-lg border-2 border-purple-100 animate-in fade-in slide-in-from-top-2">
            <input type="email" placeholder="Librarian email" className="border p-2 rounded text-sm w-64 outline-none focus:border-purple-500 font-bold" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
            <button onClick={handleSendEmail} className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-purple-700">Send</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto shadow-2xl rounded-2xl bg-white p-2 border-2 border-yellow-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-green-700 text-yellow-300 uppercase text-[12px] tracking-widest">
              <th className="py-2 px-4 border-b border-green-800">Borrower ID</th>
              <th className="py-2 px-4 border-b border-green-800">Book Title</th>
              <th className="py-2 px-4 border-b border-green-800">Borrower Name</th>
              <th className="py-2 px-4 border-b border-green-800">Dates</th>
              <th className="py-2 px-4 border-b border-green-800 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredBooks.map((book) => (
              <React.Fragment key={book._id}>
                <tr className="hover:bg-yellow-50/50 transition-colors">
                  <td className="py-0.5 px-4">
                    <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase">
                      {book.borrowerId || "NO-ID"}
                    </span>
                  </td>

                  <td className="py-0.5 px-4">
                    <div className="font-black text-gray-800 leading-tight text-sm">{book.title}</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase">
                      {book.category} • {book.subCategory}
                    </div>
                  </td>

                  <td className="py-0.5 px-4">
                    <div className="font-bold text-gray-700 text-sm">{book.borrowerName}</div>
                  </td>

                  <td className="py-0.5 px-4 text-[11px]">
                    <div className="flex flex-col leading-tight">
                      <span className="text-gray-600 font-bold">OUT: {new Date(book.borrowedDate).toLocaleDateString()}</span>
                      <span className="text-red-600 font-black">DUE: {new Date(book.returnDate).toLocaleDateString()}</span>
                    </div>
                  </td>

                  <td className="py-0.5 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => setConfirmModal({ show: true, id: book._id })} 
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] hover:bg-green-700 transition-all uppercase shadow-sm active:scale-95"
                      >
                        Mark Returned
                      </button>
                      <button 
                        onClick={() => setDeletingId(deletingId === book._id ? null : book._id)} 
                        className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] hover:bg-red-700 transition-all uppercase shadow-sm active:scale-95"
                      >
                        {deletingId === book._id ? "Cancel" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>

                {deletingId === book._id && (
                  <tr className="bg-red-50/50">
                    <td colSpan="5" className="p-2 border-l-4 border-red-600">
                      <div className="flex flex-wrap items-center gap-2 justify-center">
                        <span className="text-[9px] font-black text-red-700 uppercase italic">Admin Required:</span>
                        <input type="email" placeholder="Email" className="border-2 p-1 text-[10px] rounded-md w-32 outline-none focus:border-red-600 font-bold" value={adminCreds.email} onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })} />
                        <input type="password" placeholder="Pass" className="border-2 p-1 text-[10px] rounded-md w-32 outline-none focus:border-red-600 font-bold" value={adminCreds.password} onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })} />
                        <button onClick={() => handleConfirmDelete(book._id)} className="bg-black text-white px-3 py-1 rounded text-[9px] font-black uppercase shadow-md hover:bg-red-600 transition-colors">Confirm Delete</button>
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