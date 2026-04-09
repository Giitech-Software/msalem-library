// app/src/pages/StaffList.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [view, setView] = useState("list");
  const [bulkNames, setBulkNames] = useState("");
  const [status, setStatus] = useState({ show: false, message: "", type: "" });
  const [searchTerm, setSearchTerm] = useState(""); 

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/staff", getAuthHeaders());
      setStaff(res.data);
    } catch (err) { 
      console.error("Failed to fetch staff:", err); 
      if (err.response?.status === 401) showStatus("Session expired. Please log in.", "error");
    }
  };

  // ✅ UPDATED: Search now includes staffId
  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.staffId && s.staffId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
    try {
      await axios.post("http://localhost:5000/api/staff/bulk", { names }, getAuthHeaders());
      showStatus(`Successfully added ${names.length} staff members!`, "success");
      setBulkNames("");
      setView("list");
      fetchStaff();
    } catch (err) { 
      showStatus("Error adding staff. Make sure you are logged in.", "error");
    }
  };

  const openDeleteModal = (id) => {
    setSelectedStaffId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedStaffId(null);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/staff/${selectedStaffId}`, getAuthHeaders());
      showStatus("Staff member removed.", "success");
      fetchStaff();
      closeDeleteModal();
    } catch (err) {
      showStatus("Failed to delete. Access denied.", "error");
      closeDeleteModal();
    }
  };

  const startEdit = (member) => {
    setEditingId(member._id);
    setEditName(member.name);
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/staff/${id}`, { name: editName }, getAuthHeaders());
      showStatus("Staff member updated!", "success");
      setEditingId(null);
      fetchStaff();
    } catch (err) {
      showStatus("Update failed.", "error");
    }
  };

  const showStatus = (msg, type) => {
    setStatus({ show: true, message: msg, type });
    setTimeout(() => setStatus({ show: false }), 4000);
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen border-2 border-yellow-200 relative">
      <BackButton label="⬅ Return to Dashboard" />
      
      {status.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl text-white font-bold animate-bounce ${status.type === 'success' ? 'bg-green-700' : 'bg-red-600'}`}>
          {status.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-green-800 tracking-tight uppercase">👔 Staff Directory</h1>
          <button 
            onClick={() => setView(view === 'list' ? 'add' : 'list')}
            className={`px-6 py-2 rounded-xl font-bold shadow-lg transition-all ${
              view === 'list' ? 'bg-green-700 text-white' : 'bg-white text-green-700 border-2 border-green-700'
            }`}
          >
            {view === 'list' ? "+ Bulk Add Staff" : "View Directory"}
          </button>
        </div>

        {view === 'list' && (
          <div className="mb-6">
            <input 
              type="text"
              placeholder="🔍 Search staff by name or Staff ID..."
              className="w-full p-2 rounded-2xl border-2 border-yellow-200 shadow-sm outline-none focus:border-green-600 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {view === 'add' ? (
          <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-green-700">
            <h2 className="text-xl font-bold mb-2 text-green-800">Registration Portal</h2>
            <p className="text-sm text-gray-500 mb-6">Enter staff names separated by lines or commas.</p>
            <form onSubmit={handleBulkAdd}>
              <textarea 
                className="w-full h-64 border-2 p-4 rounded-2xl focus:border-green-600 outline-none mb-4 bg-gray-50 font-mono text-sm"
                placeholder="Mr. Thompson&#10;Madam Elizabeth..."
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                required
              />
              <button className="w-full bg-green-700 text-yellow-300 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-green-800 transition">
                Register Staff Members
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map(s => (
              <div key={s._id} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-yellow-500 flex flex-col justify-between hover:shadow-md transition group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 mr-2">
                    {editingId === s._id ? (
                      <input 
                        className="w-full border-b-2 border-green-700 outline-none font-bold text-gray-800"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-800 group-hover:text-green-700 transition">{s.name}</p>
                          {/* ✅ NEW: Staff ID Badge */}
                          {s.staffId && (
                            <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-blue-200 uppercase">
                              {s.staffId}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Official Staff</p>
                        
                        {/* ✅ NEW: Contact Display */}
                        {s.contact && (
                          <p className="text-[10px] text-gray-500 italic mt-1 truncate">📞 {s.contact}</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="bg-yellow-50 p-2 rounded-full text-xl group-hover:bg-yellow-100 transition">
                    👤
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  {editingId === s._id ? (
                    <>
                      <button onClick={() => handleUpdate(s._id)} className="flex-1 text-[10px] font-bold uppercase bg-green-700 text-white py-1.5 rounded-lg hover:bg-green-800">Save</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 text-[10px] font-bold uppercase bg-gray-200 text-gray-700 py-1.5 rounded-lg">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(s)} className="flex-1 text-[10px] font-bold uppercase bg-blue-50 text-blue-700 py-1.5 rounded-lg hover:bg-blue-100 transition">Edit</button>
                      <button onClick={() => openDeleteModal(s._id)} className="flex-1 text-[10px] font-bold uppercase bg-red-50 text-red-700 py-1.5 rounded-lg hover:bg-red-100 transition">Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {filteredStaff.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-widest">
                  {searchTerm ? `No results for "${searchTerm}"` : "No staff records found"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Modal remains the same */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Confirm Removal</h2>
            <p className="text-gray-500 text-sm mb-6">Are you sure? This will remove the staff member from the directory.</p>
            <div className="flex gap-3">
              <button onClick={closeDeleteModal} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;