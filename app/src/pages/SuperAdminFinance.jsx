import React, { useEffect, useState } from "react";
import axios from "axios";
import { DollarSign, Search, FileWarning, Calendar, User, BookOpen, RefreshCw } from "lucide-react";
import BackButton from "../components/BackButton";

const SuperAdminFinance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, physical: 0, digital: 0 });

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/financials", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data);
      
      // Calculate Stats
      const total = res.data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const physical = res.data.filter(r => r.bookType === "Physical").reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const digital = res.data.filter(r => r.bookType === "Digital").reduce((acc, curr) => acc + (curr.amount || 0), 0);
      setStats({ total, physical, digital });
    } catch (err) {
      console.error("Failed to fetch financial records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  const filteredRecords = records.filter(r => 
    r.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.borrowerId && r.borrowerId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center font-black animate-pulse text-green-800">LOADING FINANCIAL LEDGER...</div>;

  return (
    <div className="p-8 border-2 border-yellow-200 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" className="mb-6 shadow-md" />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-green-800 flex items-center gap-3">
            <DollarSign className="bg-green-700 text-yellow-300 rounded-full p-1" size={36} />
            Financial Vault
          </h1>
          <p className="text-green-600 font-bold italic">High-Security Transaction Logs (Permanent Records)</p>
        </div>

       <div className="flex gap-4 w-full md:w-auto">
  {/* Increased width from md:w-64 to md:w-80 */}
  <div className="relative flex-1 md:w-70"> 
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={18} />
    <input 
      type="text" 
      placeholder="Search by name, book or ID..." 
      className="w-full pl-10 pr-4 py-2 border-2 border-green-700 rounded-xl outline-none bg-white font-bold text-sm"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
  <button 
    onClick={fetchFinancials} 
    className="p-2 bg-green-700 text-white rounded-xl hover:rotate-180 transition-all duration-500 shadow-md active:scale-90"
    title="Refresh Data"
  >
    <RefreshCw size={20} />
  </button>
</div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-xl border-b-4 border-green-600">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Revenue</p>
          <h3 className="text-3xl font-black text-green-700">GHS {stats.total.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-xl border-b-4 border-blue-600">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Physical Book Fees</p>
          <h3 className="text-3xl font-black text-blue-700">GHS {stats.physical.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-xl border-b-4 border-purple-600">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Digital Sales</p>
          <h3 className="text-3xl font-black text-purple-700">GHS {stats.digital.toFixed(2)}</h3>
        </div>
      </div>

      {/* LEDGER TABLE */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-yellow-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-green-800 text-yellow-300 text-[11px] uppercase tracking-tighter">
              <th className="p-2">Date/Time</th>
              <th className="p-2">Borrower Details</th>
              <th className="p-2">Book Info</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Issued By</th>
              <th className="p-2 text-center">Security Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRecords.map((record) => (
              <tr key={record._id} className={`hover:bg-yellow-50 transition-colors ${record.isOrphaned ? 'bg-red-50' : ''}`}>
                <td className="p-2 font-mono text-[10px] text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} />
                    {new Date(record.date).toLocaleString()}
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 flex items-center gap-1">
                      <User size={14} className="text-green-600" /> {record.borrowerName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{record.borrowerId || "No ID"}</span>
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-700 text-sm flex items-center gap-1">
                      <BookOpen size={14} className="text-blue-500" /> {record.title}
                    </span>
                    <span className={`text-[9px] font-black uppercase ${record.bookType === 'Digital' ? 'text-purple-500' : 'text-orange-500'}`}>
                      {record.bookType}
                    </span>
                  </div>
                </td>
                <td className="p-2">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-black text-xs">
                    GHS {record.amount.toFixed(2)}
                  </span>
                </td>
                <td className="p-2 text-[11px] font-bold text-gray-600">
                  {record.issuedBy}
                </td>
                <td className="p-2 text-center">
                  {record.isOrphaned ? (
                    <div className="flex items-center justify-center gap-1 text-red-600 animate-pulse">
                      <FileWarning size={16} />
                      <span className="text-[10px] font-black uppercase">Main Record Deleted</span>
                    </div>
                  ) : (
                    <span className="text-green-500 text-[10px] font-black uppercase">Verified Record</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRecords.length === 0 && (
          <div className="p-20 text-center text-gray-400 font-black uppercase tracking-widest">
            No financial records found.
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminFinance;