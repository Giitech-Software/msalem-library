import React, { useEffect, useState } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

const OverdueBooks = () => {
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [status, setStatus] = useState({ show: false, message: "", type: "" });
  
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  
  const [searchTerm, setSearchTerm] = useState("");

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const fetchOverdue = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/books/overdue", axiosConfig);
      setOverdueBooks(res.data);
    } catch (error) {
      console.error("Failed to fetch overdue books:", error);
    }
  };

  const handleExportPDF = () => {
    window.open("http://localhost:5000/api/books/reports/overdue-books/pdf", "_blank");
  };

  // ✅ UPDATED REMINDER: Handles both Email (Backend) and Phone (Device App)
  const handleSendReminder = async (book) => {
    const contact = book.contact?.trim();

    if (!contact) {
      setStatus({ show: true, message: "No contact info available.", type: "error" });
      setTimeout(() => setStatus({ show: false }), 4000);
      return;
    }

    // Check if contact is a Phone Number (contains digits, no @)
    const isPhone = /^\+?[0-9\s-]{7,15}$/.test(contact) && !contact.includes("@");

    if (isPhone) {
      // Trigger external dialer app
      window.location.href = `tel:${contact}`;
      setStatus({ show: true, message: `Opening dialer for ${book.borrowerName}...`, type: "success" });
      setTimeout(() => setStatus({ show: false }), 4000);
      return;
    }

    // Standard Email logic
    if (!contact.includes("@")) {
      setStatus({ show: true, message: "Invalid contact format.", type: "error" });
      setTimeout(() => setStatus({ show: false }), 4000);
      return;
    }

    setStatus({ show: true, message: `Sending email to ${book.borrowerName}...`, type: "success" });

    try {
      const res = await axios.post(`http://localhost:5000/api/books/remind/${book._id}`, {}, axiosConfig);
      setStatus({ show: true, message: "Reminder sent successfully!", type: "success" });
    } catch (err) {
      console.error("Reminder error:", err);
      setStatus({ 
        show: true, 
        message: err.response?.data?.message || "Failed to send reminder.", 
        type: "error" 
      });
    } finally {
      setTimeout(() => setStatus({ show: false, message: "", type: "" }), 5000);
    }
  };

  const handleSendFullReport = async () => {
    if (!emailAddress) {
      setStatus({ show: true, message: "Please enter an email address.", type: "error" });
      setTimeout(() => setStatus({ show: false }), 4000);
      return;
    }

    setShowEmailInput(false);
    setStatus({ show: true, message: "Generating and sending full report...", type: "success" });

    try {
      const res = await axios.get(`http://localhost:5000/api/books/reports/overdue-books/pdf?email=${emailAddress}`, axiosConfig);
      setStatus({ show: true, message: res.data.message, type: "success" });
      setEmailAddress(""); 
    } catch (err) {
      setStatus({ show: true, message: "Failed to send report.", type: "error" });
    } finally {
      setTimeout(() => setStatus({ show: false, message: "", type: "" }), 5000);
    }
  };

  const filteredBooks = overdueBooks.filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.borrowerId && book.borrowerId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 bg-yellow-50 min-h-screen border-2 border-yellow-200 font-sans">
      <BackButton label="⬅ Return to Dashboard" />
      
      {status.show && (
        <div className={`fixed top-4 right-4 z-50 p-3 rounded-xl shadow-2xl flex items-center gap-4 transition-all animate-in slide-in-from-top-4 ${
          status.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span className="font-bold">{status.message}</span>
          <button 
            onClick={() => setStatus({ show: false })}
            className="bg-black/20 hover:bg-black/40 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
          >✕</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-black text-red-600 uppercase tracking-tighter italic">
          ⏰📕 Overdue Inventory Alert
        </h1>

        <div className="flex-1 max-w-md w-full px-4">
          <input
            type="text"
            placeholder="Search by Title, Name, or ID..."
            className="w-full border-2 border-red-200 p-2 rounded-xl text-sm outline-none focus:border-red-500 font-bold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-black hover:bg-red-700 transition shadow-lg uppercase text-xs tracking-widest active:scale-95"
            >
              Export PDF
            </button>

            <button
              onClick={() => setShowEmailInput(!showEmailInput)}
              className="bg-purple-600 text-white px-6 py-2 rounded-xl font-black hover:bg-purple-700 transition shadow-lg flex items-center gap-2 uppercase text-xs tracking-widest active:scale-95"
            >
              📧 {showEmailInput ? "Cancel" : "Send Full Report"}
            </button>
          </div>

          {showEmailInput && (
            <div className="flex gap-2 p-2 bg-white rounded-2xl shadow-2xl border-2 border-purple-100 animate-in slide-in-from-right-5">
              <input
                type="email"
                placeholder="Recipient Email"
                className="border-2 border-gray-100 p-2 rounded-xl text-sm w-48 md:w-64 outline-none focus:border-purple-500 font-bold"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
              <button
                onClick={handleSendFullReport}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-purple-700 transition"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto shadow-2xl rounded-2xl bg-white p-2 border-2 border-yellow-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-red-600 text-white uppercase text-[12px] tracking-widest">
              <th className="py-2 px-4 border-b border-red-700">Borrower ID</th>
              <th className="py-2 px-4 border-b border-red-700">Book Information</th>
              <th className="py-2 px-4 border-b border-red-700">Borrower Name</th>
              <th className="py-2 px-4 border-b border-red-700">Contact Action</th>
              <th className="py-2 px-4 border-b border-red-700">Due Status</th>
              <th className="py-2 px-4 border-b border-red-700 text-right">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBooks.map((book) => (
              <tr key={book._id} className="hover:bg-red-50/50 transition-colors">
                <td className="py-0.5 px-4">
                  <span className="text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                    {book.borrowerId || "NO-ID"}
                  </span>
                </td>
                <td className="py-0.5 px-4">
                  <div className="font-black text-gray-800 leading-tight text-sm uppercase">{book.title}</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                    {book.category} • {book.subCategory}
                  </div>
                </td>
                <td className="py-0.5 px-4">
                  <div className="font-bold text-gray-700 text-sm">{book.borrowerName}</div>
                </td>
                <td className="py-0.5 px-4">
                  <button 
                    onClick={() => handleSendReminder(book)}
                    className="font-black text-blue-700 text-[10px] uppercase bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all active:scale-95 group"
                    title={`Contact ${book.borrowerName}`}
                  >
                    <span className="group-hover:hidden">
                       {book.contact?.includes("@") ? "📩" : "📞"} {book.contact || "Missing"}
                    </span>
                    <span className="hidden group-hover:inline">
                       {book.contact?.includes("@") ? "🚀 Send Mail" : "📱 Start Call"}
                    </span>
                  </button>
                </td>
                <td className="py-1 px-4">
                  <div className="flex flex-col leading-tight">
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Due Since:</span>
                    <span className="text-red-600 font-black text-sm">{new Date(book.returnDate).toLocaleDateString()}</span>
                  </div>
                </td>
                <td className="py-0.5 px-4 text-right">
                  <span className="text-[9px] text-gray-400 font-black italic uppercase">
                    #{book._id.slice(-6)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 bg-red-50 rounded-b-xl flex justify-center">
            <p className="text-red-600 font-black text-[11px] uppercase flex items-center gap-2">
              <span className="animate-pulse text-lg">●</span> 
              {filteredBooks.length} Overdue Records ● Follow up via Email or Phone
            </p>
        </div>
      </div>
    </div>
  );
};

export default OverdueBooks;