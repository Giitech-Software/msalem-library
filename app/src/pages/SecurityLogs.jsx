import React, { useEffect, useState } from "react";
import axios from "axios";
import { ShieldCheck, Search, RefreshCcw, Clock } from "lucide-react"; 
import BackButton from "../components/BackButton";

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionStyle = (action) => {
    if (action.includes("Delete")) return "bg-red-100 text-red-700 border-red-200";
    if (action.includes("Register") || action.includes("Create") || action.includes("Login")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (action.includes("Suspended") || action.includes("Update") || action.includes("Returned")) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="p-8 border-2 border-yellow-200 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" className="mb-6 shadow-md" />

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-4xl font-black text-green-800 border-l-8 border-green-600 pl-4 flex items-center gap-3">
          <ShieldCheck size={40} className="text-green-600" />
          System Audit Trail
        </h1>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Filter by admin or action..."
              className="pl-10 pr-4 py-2 border-2 border-green-200 rounded-xl outline-none focus:border-green-600 w-full shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchLogs}
            className="p-2 bg-white border-2 border-green-200 rounded-xl hover:bg-green-50 text-green-700 transition-all shadow-sm"
            title="Refresh Logs"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-yellow-200 p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Reduced header padding to py-0.5 */}
              <tr className="bg-green-800 text-yellow-300 uppercase text-[11px] tracking-widest">
                <th className="py-2 px-4 border-b border-green-900">
                  <span className="flex items-center gap-2"><Clock size={12} /> Timestamp</span>
                </th>
                <th className="py-2 px-4 border-b border-green-900">Admin Entity</th>
                <th className="py-2 px-4 border-b border-green-900 text-center">Event Type</th>
                <th className="py-2 px-4 border-b border-green-900">Action Details</th>
              </tr>
            </thead>
            {/* Increased visibility row separators */}
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-green-800 font-bold animate-pulse uppercase text-xs">
                    Retrieving Secure Logs...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-yellow-50 transition-colors">
                    {/* Applied compact py-0.5 to all cells */}
                    <td className="py-0.5 px-4 text-gray-500 font-mono text-[10px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-0.5 px-4">
                      <div className="font-black text-gray-800 text-sm leading-tight">{log.adminEmail}</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-tighter font-bold">Authorized Operator</div>
                    </td>
                    <td className="py-0.5 px-4 text-center">
                      <span className={`px-2 py-0 border rounded-full text-[9px] font-black uppercase ${getActionStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-0.5 px-4 text-gray-600 text-[11px] italic font-medium leading-tight">
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-gray-400 italic text-xs">
                    No matching activity found in the secure database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 py-1 text-center text-[9px] text-gray-400 uppercase font-bold tracking-widest border-t">
          End of Secure Audit Log — Access Restricted to Superadmin Only
        </div>
      </div>
    </div>
  );
};

export default SecurityLogs;