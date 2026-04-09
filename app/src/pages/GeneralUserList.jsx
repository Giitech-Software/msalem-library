// app/src/pages/GeneralUserList.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

const GeneralUserList = () => {
  const [users, setUsers] = useState([]);
  const [view, setView] = useState("list");
  const [bulkNames, setBulkNames] = useState("");
  const [subCategory, setSubCategory] = useState("Community Member");
  const [status, setStatus] = useState({ show: false, message: "", type: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/general", getAuthHeaders());
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const showStatus = (msg, type) => {
    setStatus({ show: true, message: msg, type });
    setTimeout(() => setStatus({ show: false }), 4000);
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
    try {
      await axios.post("http://localhost:5000/api/general/bulk", { names, subCategory }, getAuthHeaders());
      showStatus(`Added ${names.length} users!`, "success");
      setBulkNames("");
      setView("list");
      fetchUsers();
    } catch (err) {
      showStatus("Import failed.", "error");
    }
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/general/${id}`, { name: editName }, getAuthHeaders());
      showStatus("User updated!", "success");
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      showStatus("Update failed.", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/general/${selectedId}`, getAuthHeaders());
      showStatus("User removed.", "success");
      fetchUsers();
      setIsDeleteModalOpen(false);
    } catch (err) {
      showStatus("Delete failed.", "error");
    }
  };

  // ✅ UPDATED: Search includes borrowerId
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.borrowerId && u.borrowerId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 bg-yellow-50 min-h-screen border-2 border-yellow-200 relative">
      <BackButton label="⬅ Return to Dashboard" />
      
      {status.show && (
        <div className={`fixed top-6 right-6 z-50 p-3 pl-5 rounded-xl shadow-lg flex items-center gap-4 border-l-4 bg-white ${status.type === 'success' ? 'text-green-800 border-green-600' : 'text-red-800 border-red-600'}`}>
          <span className="font-bold text-sm">{status.message}</span>
          <button onClick={() => setStatus({ show: false })} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-blue-800 tracking-tight uppercase">🌍 General Users</h1>
          <button 
            onClick={() => setView(view === 'list' ? 'add' : 'list')}
            className={`px-6 py-2 rounded-xl font-bold shadow-lg transition-all ${view === 'list' ? 'bg-blue-700 text-white' : 'bg-white text-blue-700 border-2 border-blue-700'}`}
          >
            {view === 'list' ? "+ Bulk Add Users" : "View Directory"}
          </button>
        </div>

        {view === 'list' ? (
          <>
            <input 
              type="text" placeholder="🔍 Search by name or ID..." 
              className="w-full p-2 rounded-2xl border-2 border-yellow-200 mb-6 outline-none focus:border-blue-600 transition"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredUsers.map(u => (
                <div key={u._id} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-500 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    {editingId === u._id ? (
                      <input 
                        className="font-bold border-b-2 border-blue-600 outline-none w-full" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                        autoFocus
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-gray-800">{u.name}</p>
                          {/* ✅ NEW: General ID Badge */}
                          {u.borrowerId && (
                            <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-blue-200 uppercase">
                              {u.borrowerId}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{u.subCategory || "General User"}</p>
                        
                        {/* ✅ NEW: Contact Display */}
                        {u.contact && (
                          <p className="text-[10px] text-gray-500 italic mt-1 truncate">📞 {u.contact}</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4 pt-2 border-t border-gray-50">
                    {editingId === u._id ? (
                      <>
                        <button onClick={() => handleUpdate(u._id)} className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded-lg uppercase">Save</button>
                        <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-200 text-gray-700 text-[10px] font-bold py-1.5 rounded-lg uppercase">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(u._id); setEditName(u.name); }} className="flex-1 text-[10px] bg-blue-50 text-blue-700 py-1.5 rounded-lg font-bold uppercase hover:bg-blue-100 transition">Edit</button>
                        <button onClick={() => { setSelectedId(u._id); setIsDeleteModalOpen(true); }} className="flex-1 text-[10px] bg-red-50 text-red-700 py-1.5 rounded-lg font-bold uppercase hover:bg-red-100 transition">Delete</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                 <p className="col-span-full text-center text-gray-400 font-bold py-10">No users matching search.</p>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-blue-700">
            <label className="block font-bold mb-2">Assign Category</label>
            <select className="w-full p-2 mb-4 border-2 rounded-xl outline-none focus:border-blue-600" onChange={(e) => setSubCategory(e.target.value)}>
              <option>Community Member</option>
              <option>Parent</option>
              <option>Alumni</option>
              <option>Visitor</option>
            </select>
            <form onSubmit={handleBulkAdd}>
              <textarea 
                className="w-full h-48 border-2 p-4 rounded-2xl mb-4 bg-gray-50 font-mono text-sm outline-none focus:border-blue-600"
                placeholder="Name 1&#10;Name 2..."
                value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} required 
              />
              <button className="w-full bg-blue-700 text-white py-3 rounded-2xl font-black uppercase shadow-xl hover:bg-blue-800 transition">Register Users</button>
            </form>
          </div>
        )}
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Delete User?</h2>
            <p className="text-sm text-gray-500 mb-6">This action will permanently remove this record from the registry.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-gray-700">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralUserList;