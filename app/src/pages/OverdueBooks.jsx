import React, { useEffect, useState } from "react";
import API from "../api/axiosInstance";
import BackButton from "../components/BackButton";

const OverdueBooks = () => {
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [status, setStatus] = useState({ show: false, message: "", type: "" });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOverdue();
  }, [startDate, endDate]);

  const fetchOverdue = async () => {
    try {
      const res = await API.get("/books/overdue", {
        params: { startDate, endDate }
      });
      setOverdueBooks(res.data);
    } catch (error) {
      console.error("Failed to fetch overdue books:", error);
    }
  };

  const handleExportPDF = () => {
    const token = localStorage.getItem("token");
    window.open(`http://localhost:5000/api/books/reports/overdue-books/pdf?token=${token}${startDate ? `&startDate=${startDate}` : ""}${endDate ? `&endDate=${endDate}` : ""}`, "_blank");
  };

  const handleSendReminder = async (book) => {
    const contact = book.contact?.trim();
    if (!contact) {
      setStatus({ show: true, message: "No contact info available.", type: "error" });
      setTimeout(() => setStatus({ show: false }), 4000);
      return;
    }
    const isPhone = /^\+?[0-9\s-]{7,15}$/.test(contact) && !contact.includes("@");
    if (isPhone) {
      window.location.href = `tel:${contact}`;
      setStatus({ show: true, message: `Opening dialer for ${book.borrowerName}...`, type: "success" });
      setTimeout(() => setStatus({ show: false }), 4000);
      return;
    }
    if (!contact.includes("@")) {
      setStatus({ show: true, message: "Invalid contact format.", type: "error" });
      setTimeout(() => setStatus({ show: false }), 4000);
      return;
    }
    setStatus({ show: true, message: `Sending email to ${book.borrowerName}...`, type: "success" });
    try {
      await API.post(`/books/remind/${book._id}`, {});
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
      const res = await API.get(`/books/reports/overdue-books/pdf`, {
        params: { email: emailAddress, startDate, endDate }
      });
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

  const totalOutstandingValue = filteredBooks.reduce((sum, b) => sum + (b.borrowingCost || 0), 0);

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

      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-black text-red-600 uppercase tracking-tighter italic whitespace-nowrap">
          ⏰📕 Overdue Inventory
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* ✅ DATE FILTER WITH CLEAR BUTTON */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border-2 border-red-100 shadow-sm">
            <div className="flex flex-col">
               <label className="text-[8px] font-black text-red-400 uppercase ml-1">From</label>
               <input type="date" className="text-[10px] font-bold outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="h-6 w-[2px] bg-red-50"></div>
            <div className="flex flex-col">
               <label className="text-[8px] font-black text-red-400 uppercase ml-1">To</label>
               <input type="date" className="text-[10px] font-bold outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => {setStartDate(""); setEndDate("");}} 
                className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded font-black hover:bg-red-100 uppercase transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="w-48 lg:w-64">
            <input
              type="text"
              placeholder="Search by Title, Borrower, or ID"
              className="w-full border-2 border-red-200 p-2 rounded-xl text-xs outline-none focus:border-red-500 font-bold shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 relative">
            <button
              onClick={handleExportPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-xl font-black hover:bg-red-700 transition shadow-lg uppercase text-[10px] tracking-widest active:scale-95 flex items-center gap-2"
            >
              📄 PDF
            </button>
<button
  onClick={() => {
    setShowEmailInput(!showEmailInput);
    if (showEmailInput) setEmailAddress(""); // Reset email when canceling
  }}
  className="bg-purple-600 text-white px-4 py-2 rounded-xl font-black hover:bg-purple-700 transition shadow-lg flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
>
  📧 {showEmailInput ? "CANCEL" : "EMAIL"}
</button>

          {showEmailInput && (
  <div className="absolute top-full right-0 mt-2 z-10 flex gap-2 p-2 bg-white rounded-2xl shadow-2xl border-2 border-purple-100 animate-in slide-in-from-top-2">
    <input
      type="email"
      placeholder="Recipient Email"
      className="border-2 border-gray-100 p-2 rounded-xl text-xs w-48 outline-none focus:border-purple-500 font-bold"
      value={emailAddress}
      onChange={(e) => setEmailAddress(e.target.value)}
    />
    <button
      onClick={handleSendFullReport}
      className="bg-purple-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-purple-700 transition"
    >
      Send
    </button>
  </div>
)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto shadow-2xl rounded-2xl bg-white p-2 border-2 border-yellow-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-red-600 text-white uppercase text-[12px] tracking-widest">
              <th className="py-2 px-4 border-b border-red-700">Borrower ID</th>
              <th className="py-2 px-4 border-b border-red-700">Book Info</th>
              <th className="py-2 px-4 border-b border-red-700">Borrower Name</th>
              <th className="py-2 px-4 border-b border-red-700">Contact Action</th>
              <th className="py-2 px-4 border-b border-red-700">Financials</th>
              <th className="py-2 px-4 border-b border-red-700">Due Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBooks.map((book) => (
              <tr key={book._id} className="hover:bg-red-50/50 transition-colors">
                <td className="py-1 px-4">
                  <span className="text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                    {book.borrowerId || "NO-ID"}
                  </span>
                </td>
                <td className="py-1 px-4">
                  <div className="font-black text-gray-800 leading-tight text-sm uppercase">{book.title}</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                    {book.category} • {book.bookType || "Physical"}
                  </div>
                </td>
                <td className="py-1 px-4">
                  <div className="font-bold text-gray-700 text-sm">{book.borrowerName}</div>
                </td>
                <td className="py-1 px-4">
                  <button 
                    onClick={() => handleSendReminder(book)}
                    className="font-black text-blue-700 text-[10px] uppercase bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all active:scale-95 group"
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
                   <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Fees:</span>
                      <span className="text-green-700 font-black text-sm">${book.borrowingCost || 0}</span>
                   </div>
                </td>
                <td className="py-1 px-4">
                  <div className="flex flex-col leading-tight">
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Due Since:</span>
                    <span className="text-red-600 font-black text-sm">{new Date(book.returnDate).toLocaleDateString()}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 bg-red-50 rounded-b-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-red-600 font-black text-[11px] uppercase flex items-center gap-2">
              <span className="animate-pulse text-lg">●</span> 
              {filteredBooks.length} Overdue Records ● Follow up via Phone/Email
            </p>
            <div className="bg-white px-4 py-2 rounded-xl border-2 border-red-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-500 uppercase mr-2">Total At Risk Value:</span>
                <span className="text-red-600 font-black text-lg">${totalOutstandingValue}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OverdueBooks;