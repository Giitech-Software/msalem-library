import React, { useEffect, useState } from "react";
import axios from "axios";
import { ShieldAlert, UserPlus, Trash2, UserCheck } from "lucide-react"; 
import BackButton from "../components/BackButton"; // ✅ Using your custom component

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ show: false, message: "", type: "" });

  // Form State
  const [newAdmin, setNewAdmin] = useState({ email: "", password: "", role: "admin" });

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch failed", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
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
    } catch (err) {
      setStatus({ show: true, message: "Update failed", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this admin?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus({ show: true, message: "Admin Deleted", type: "success" });
      fetchAdmins();
    } catch (err) {
      setStatus({ show: true, message: "Delete failed", type: "error" });
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">Loading Admin Data...</div>;

  return (
    <div className="p-8 bg-yellow-50 min-h-screen">
      {/* ✅ Implementation of your Custom Back Button */}
      <BackButton label="⬅ Return to Dashboard" className="mb-6 shadow-md" />

      {status.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-2xl text-white font-bold z-50 animate-pulse ${status.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {status.message}
          <button onClick={() => setStatus({ ...status, show: false })} className="ml-4 underline text-xs">OK</button>
        </div>
      )}

      <h1 className="text-4xl font-black text-green-800 mb-8 border-l-8 border-green-600 pl-4">
        🛡️ Superadmin Panel
      </h1>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* ADD ADMIN FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-yellow-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
            <UserPlus /> Register New Admin
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
               <label className="text-xs font-bold text-gray-500 uppercase">Admin Email</label>
               <input 
                type="email" placeholder="example@school.com" required 
                className="w-full p-3 border-2 border-gray-100 rounded-xl outline-green-500"
                value={newAdmin.email} onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
              />
            </div>
            <div>
               <label className="text-xs font-bold text-gray-500 uppercase">Temporary Password</label>
               <input 
                type="password" placeholder="••••••••" required 
                className="w-full p-3 border-2 border-gray-100 rounded-xl outline-green-500"
                value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
              />
            </div>
            <button className="w-full bg-green-600 text-yellow-300 font-bold py-3 rounded-xl hover:bg-green-700 transition-all shadow-md">
              Confirm Registration
            </button>
          </form>
        </div>

        {/* ADMIN LIST */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-yellow-200">
          <table className="w-full text-left">
            <thead className="bg-green-800 text-yellow-300 uppercase text-xs">
              <tr>
                <th className="p-4">Staff Email</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-center">Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id} className="border-b border-yellow-50 hover:bg-yellow-50 transition">
                  <td className="p-4 font-bold text-gray-700">
                    {admin.email} {admin.role === 'superadmin' && <span className="ml-2 text-xs bg-yellow-400 text-green-900 px-2 py-0.5 rounded-full">👑 OWNER</span>}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${admin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {admin.status || 'active'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-3">
                    {admin.role !== 'superadmin' && (
                      <>
                        <button 
                          onClick={() => handleToggleStatus(admin._id, admin.status || 'active')}
                          className={`p-2 rounded-xl transition-all shadow-sm ${admin.status === 'suspended' ? 'bg-green-600 text-white hover:scale-110' : 'bg-orange-500 text-white hover:scale-110'}`}
                          title={admin.status === 'suspended' ? "Unsuspend Admin" : "Suspend Admin"}
                        >
                          {admin.status === 'suspended' ? <UserCheck size={18} /> : <ShieldAlert size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(admin._id)}
                          className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 hover:scale-110 transition-all shadow-sm"
                          title="Delete Admin"
                        >
                          <Trash2 size={18} />
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
    </div>
  );
};

export default AdminManagement;