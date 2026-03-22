import React, { useEffect, useState } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

const OverdueBooks = () => {
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [status, setStatus] = useState({ show: false, message: "", type: "" });
  
  // ✅ Electron Fix: Use state instead of window.prompt
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

  useEffect(() => {
    fetchOverdue();
  }, []);

  const fetchOverdue = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/books/overdue");
      setOverdueBooks(res.data);
    } catch (error) {
      console.error("Failed to fetch overdue books:", error);
    }
  };

  const handleExportPDF = () => {
    window.open("http://localhost:5000/api/books/reports/overdue-books/pdf", "_blank");
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      setStatus({ show: true, message: "Please enter an email address.", type: "error" });
      setTimeout(() => setStatus({ show: false }), 4000);
      return;
    }

    // Hide input and show loading status
    setShowEmailInput(false);
    setStatus({ show: true, message: "Sending email... please wait.", type: "success" });

    try {
      const res = await axios.get(`http://localhost:5000/api/books/reports/overdue-books/pdf?email=${emailAddress}`);
      setStatus({ show: true, message: res.data.message, type: "success" });
      setEmailAddress(""); 
    } catch (err) {
      console.error("Email error:", err);
      setStatus({ 
        show: true, 
        message: err.response?.data?.message || "Failed to send email.", 
        type: "error" 
      });
    } finally {
      setTimeout(() => setStatus({ show: false, message: "", type: "" }), 5000);
    }
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" />
      
      {/* FLOATING NOTIFICATION */}
      {status.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center gap-4 transition-all ${
          status.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span className="font-bold">{status.message}</span>
          <button 
            onClick={() => setStatus({ show: false })}
            className="bg-black/20 hover:bg-black/40 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-extrabold text-green-700 text-center md:text-left">
          ⏰📕 Overdue Books
        </h1>

        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition shadow-md"
            >
              Export PDF
            </button>

            <button
              onClick={() => setShowEmailInput(!showEmailInput)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition shadow-md flex items-center gap-2"
            >
              📧 {showEmailInput ? "Cancel" : "Send Email"}
            </button>
          </div>

          {/* INLINE EMAIL INPUT (ELECTRON FRIENDLY) */}
          {showEmailInput && (
            <div className="flex gap-2 p-2 bg-white rounded-lg shadow-lg border-2 border-purple-100 animate-in fade-in slide-in-from-top-2">
              <input
                type="email"
                placeholder="Enter email address"
                className="border p-2 rounded text-sm w-48 md:w-64 outline-none focus:border-purple-500"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
              <button
                onClick={handleSendEmail}
                className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-purple-700"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>

      {overdueBooks.length === 0 ? (
        <p className="text-center text-lg text-gray-600 bg-white p-10 rounded-xl shadow-inner">
          No overdue books at the moment.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {overdueBooks.map((book) => (
            <div
              key={book._id}
              className="bg-white shadow-lg p-6 rounded-xl border-t-4 border-red-500 hover:scale-[1.02] transition-transform"
            >
              <h2 className="text-xl font-bold text-green-700 mb-2">{book.title}</h2>
              <div className="space-y-1 text-gray-700">
                <p><strong>Borrower:</strong> {book.borrowerName}</p>
                <p><strong>Borrowed Date:</strong> {new Date(book.borrowedDate).toLocaleDateString()}</p>
                <p><strong>Return Date:</strong> {new Date(book.returnDate).toLocaleDateString()}</p>
              </div>
              <p className="text-red-600 font-bold mt-3 flex items-center gap-1">
                <span className="animate-pulse">⚠</span> Overdue!
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OverdueBooks;