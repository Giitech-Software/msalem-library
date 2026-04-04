import React, { useEffect, useState } from "react";
import axios from "axios";
import { ShieldAlert, UserPlus, Trash2, UserCheck, History, Users, Search } from "lucide-react"; 
import BackButton from "../components/BackButton";

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("admins"); // 'admins' or 'logs'
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ show: false, message: "", type: "" });
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null });
  const [newAdmin, setNewAdmin] = useState({ email: "", password: "", role: "admin" });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) {
      console.error("Logs fetch failed", err);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchLogs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/auth/register", newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus({ show: true, message: "Admin Created Successfully!", type: "success" });
      setNewAdmin({ email: "", password: "", role: "admin" });
      fetchAdmins();
      fetchLogs();
    } catch (err) {
      setStatus({ show: true, message: err.response?.data?.message || "Error creating admin", type: "error" });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      await axios.patch(`http://localhost:5000/api/auth/users/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus({ show: true, message: `Admin is now ${newStatus}`, type: "success" });
      fetchAdmins();
      fetchLogs();
    } catch (err) {
      setStatus({ show: true, message: "Update failed", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus({ show: true, message: "Admin Deleted", type: "success" });
      fetchAdmins();
      fetchLogs();
    } catch (err) {
      setStatus({ show: true, message: "Delete failed", type: "error" });
    }
  };

  const filteredLogs = logs.filter(log => 
    log.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center font-bold">Loading Security Data...</div>;

  return (
    <div className="p-8 border-2 border-yellow-200 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" className="mb-6 shadow-md" />

      {status.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-2xl text-white font-bold z-50 animate-pulse ${status.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {status.message}
          <button onClick={() => setStatus({ ...status, show: false })} className="ml-4 underline text-xs">OK</button>
        </div>
      )}

      <div className="flex justify-between items-end mb-8 border-l-8 border-green-600 pl-4">
        <h1 className="text-4xl font-black text-green-800">🛡️ Superadmin Panel</h1>
        
        {/* SEARCH FIELD */}
        <div className="relative w-1/3 px-4">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-green-600" size={18} />
          <input 
            type="text" 
            placeholder="Search activity logs..." 
            className="w-full pl-10 pr-4 py-2 bg-white border-2 border-green-700 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none font-bold text-green-800 placeholder:text-green-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-white rounded-xl shadow-md border-2 border-green-700 overflow-hidden">
          <button 
            onClick={() => setActiveTab("admins")}
            className={`px-6 py-2 flex items-center gap-2 font-bold transition-all ${activeTab === 'admins' ? 'bg-green-700 text-white' : 'text-green-700 hover:bg-green-50'}`}
          >
            <Users size={18}/> Admins
          </button>
          <button 
            onClick={() => setActiveTab("logs")}
            className={`px-6 py-2 flex items-center gap-2 font-bold transition-all ${activeTab === 'logs' ? 'bg-green-700 text-white' : 'text-green-700 hover:bg-green-50'}`}
          >
            <History size={18}/> Activity Logs
          </button>
        </div>
      </div>

      {activeTab === "admins" ? (
        <div className="grid lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
          {/* ADD ADMIN FORM */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-yellow-200 h-fit">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
              <UserPlus /> Register New Admin
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Admin Email</label>
                <input type="email" required className="w-full p-2 border-2 border-gray-100 rounded-xl outline-green-500" value={newAdmin.email} onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Temporary Password</label>
                <input type="password" required className="w-full p-2 border-2 border-gray-100 rounded-xl outline-green-500" value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})} />
              </div>
              <button className="w-full bg-green-600 text-yellow-300 font-bold py-3 rounded-xl hover:bg-green-700 transition-all shadow-md active:scale-95">Confirm Registration</button>
            </form>
          </div>

          {/* ADMIN LIST */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-yellow-200 p-2">
            <table className="w-full text-left border-collapse">
              <thead className="bg-green-800 text-yellow-300 uppercase text-[11px] tracking-widest">
                <tr>
                  <th className="py-2 px-4 border-b border-green-900">Staff Email</th>
                  <th className="py-2 px-4 border-b border-green-900">Current Status</th>
                  <th className="py-2 px-4 border-b border-green-900 text-center">Security Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-50">
                {admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-yellow-50 transition-colors">
                    <td className="py-1 px-4 font-bold text-gray-700 text-sm">
                      {admin.email}
                      {admin.role === 'superadmin' && <span className="ml-2 text-[9px] bg-yellow-400 text-green-900 px-2 py-0.5 rounded-full font-black">👑 OWNER</span>}
                    </td>
                    <td className="py-1 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${admin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {admin.status || 'active'}
                      </span>
                    </td>
                    <td className="py-1 px-4 flex justify-center gap-2">
                      {admin.role !== 'superadmin' && (
                        <>
                          <button onClick={() => handleToggleStatus(admin._id, admin.status || 'active')} className={`p-1.5 rounded-lg transition-all shadow-sm active:scale-90 ${admin.status === 'suspended' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                            {admin.status === 'suspended' ? <UserCheck size={14} /> : <ShieldAlert size={14} />}
                          </button>
                          <button onClick={() => setConfirmModal({ show: true, id: admin._id })} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-90 transition-all shadow-sm">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* LOGS VIEW (Now Compact) */
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-yellow-200 animate-in slide-in-from-right duration-500 p-2">
          <div className="p-3 bg-gray-50 border-b font-black text-gray-600 text-xs flex justify-between items-center uppercase tracking-tighter">
            <span>System Audit Trail (Latest Actions)</span>
            <button onClick={fetchLogs} className="text-[10px] bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-800 transition-colors uppercase">Refresh Logs</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-yellow-400 uppercase text-[10px] tracking-widest">
              <tr>
                <th className="py-2 px-4">Timestamp</th>
                <th className="py-2 px-4">Admin Email</th>
                <th className="py-2 px-4">Action Taken</th>
                <th className="py-2 px-4">Target/Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-bold">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-1 px-4 text-gray-400 font-mono text-[10px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-1 px-4 text-gray-700">{log.adminEmail}</td>
                  <td className="py-1 px-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      log.action.includes('Delete') ? 'bg-red-100 text-red-600' : 
                      log.action.includes('Register') ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-1 px-4 text-gray-500 text-[11px] italic">{log.details}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="p-10 text-center text-gray-400 italic font-black uppercase">No security logs matching search query.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-w-87.5 text-center border-b-8 border-red-600">
            <h2 className="text-xl font-black text-red-600 mb-2 uppercase tracking-tighter">Security Alert</h2>
            <p className="text-sm font-bold text-gray-600 mb-6">Are you sure you want to permanently delete this admin? This action is logged.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { handleDelete(confirmModal.id); setConfirmModal({ show: false, id: null }); }} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-red-700 active:scale-95">Yes, Delete</button>
              <button onClick={() => setConfirmModal({ show: false, id: null })} className="flex-1 bg-gray-200 text-gray-600 py-2 rounded-xl font-black uppercase text-xs hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;