import React, { useState, useEffect } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [view, setView] = useState("list"); 
  const [status, setStatus] = useState({ show: false, message: "", type: "" });
  const [searchTerm, setSearchTerm] = useState(""); 

  const [form, setForm] = useState({ name: "", category: "", subCategory: "" });
  const [bulkData, setBulkData] = useState("");
  const [promo, setPromo] = useState({ from: "", to: "" });
  const [gradClass, setGradClass] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const [modal, setModal] = useState({ open: false, type: null, id: null, title: "", message: "", color: "bg-red-600" });

  const categories = {
    Preschool: ["Nursery", "Kg1", "Kg2"],
    "Lower Primary": ["B1", "B2", "B3"],
    "Upper Primary": ["B4", "B5", "B6"],
    JHS: ["JHS1", "JHS2", "JHS3"],
    SHS: ["SHS1", "SHS2", "SHS3"]
  };

  const allSubCategories = Object.values(categories).flat();

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/students", getAuthHeaders());
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };

  const filteredStudents = students.filter(std => 
    std.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    std.subCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBulkImport = async (e) => {
    e.preventDefault();
    const nameArray = bulkData.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
    try {
      await axios.post("http://localhost:5000/api/students/bulk", {
        names: nameArray,
        category: form.category,
        subCategory: form.subCategory
      }, getAuthHeaders()); // ✅ Added Headers
      
      showStatus(`Successfully imported ${nameArray.length} students!`, "success");
      setBulkData("");
      setView("list");
      fetchStudents();
    } catch (err) { showStatus("Import failed. Check your login.", "error"); }
  };

  const closeModal = () => setModal({ ...modal, open: false });

  const triggerPromote = (e) => {
    e.preventDefault();
    setModal({
      open: true,
      type: 'promote',
      title: 'Confirm Class Promotion',
      message: `Are you sure you want to promote all students from ${promo.from} to ${promo.to}?`,
      color: 'bg-blue-600'
    });
  };

  const triggerGraduate = () => {
    if (!gradClass) return showStatus("Select a class first", "error");
    setModal({
      open: true,
      type: 'graduate',
      title: 'Confirm Graduation',
      message: `Move all ${gradClass} students to Archive? This cannot be undone.`,
      color: 'bg-red-600'
    });
  };

  const triggerDelete = (id) => {
    setModal({
      open: true,
      type: 'delete',
      id: id,
      title: 'Confirm Permanent Deletion',
      message: 'Remove this student record from the registry permanently?',
      color: 'bg-red-700'
    });
  };

  const handleConfirmAction = async () => {
    try {
      if (modal.type === 'promote') {
        const res = await axios.post("http://localhost:5000/api/students/promote", {
          fromSubCategory: promo.from,
          toSubCategory: promo.to
        }, getAuthHeaders()); // ✅ Added Headers
        showStatus(res.data.message, "success");
      } else if (modal.type === 'graduate') {
        const res = await axios.post("http://localhost:5000/api/students/graduate", {
          subCategory: gradClass
        }, getAuthHeaders()); // ✅ Added Headers
        showStatus(res.data.message, "success");
      } else if (modal.type === 'delete') {
        await axios.delete(`http://localhost:5000/api/students/${modal.id}`, getAuthHeaders()); // ✅ Added Headers
        showStatus("Student removed", "success");
      }
      fetchStudents();
      closeModal();
    } catch (err) {
      showStatus("Action failed. Session may have expired.", "error");
      closeModal();
    }
  };

  const startEdit = (std) => {
    setEditingId(std._id);
    setEditName(std.name);
  };

  const handleUpdateStudent = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/students/${id}`, { name: editName }, getAuthHeaders()); // ✅ Added Headers
      showStatus("Student updated", "success");
      setEditingId(null);
      fetchStudents();
    } catch (err) { showStatus("Update failed.", "error"); }
  };

  const showStatus = (msg, type) => {
    setStatus({ show: true, message: msg, type });
    setTimeout(() => setStatus({ show: false }), 4000);
  };

  // ... (Rest of the JSX remains the same as your previous version)
  return (
    <div className="p-8 bg-yellow-50 min-h-screen border-2 border-yellow-200 relative">
      <BackButton label="⬅ Return to Dashboard" />
      
      {status.show && (
        <div className={`fixed top-4 right-4 z-70 p-4 rounded-xl shadow-2xl text-white font-bold animate-bounce ${status.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {status.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-black text-green-800 uppercase tracking-tight">👥 Student Registry</h1>
          <div className="flex flex-wrap gap-2 bg-white p-1 rounded-2xl shadow-md border border-yellow-200">
            <button onClick={() => setView("list")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'list' ? 'bg-green-700 text-white' : 'text-green-700 hover:bg-green-50'}`}>View All</button>
            <button onClick={() => setView("bulk")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'bulk' ? 'bg-yellow-500 text-white' : 'text-yellow-600 hover:bg-yellow-50'}`}>Bulk Import</button>
            <button onClick={() => setView("promote")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'promote' ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}>Promote</button>
            <button onClick={() => setView("graduate")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'graduate' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'}`}>Graduate</button>
          </div>
        </div>

        {view === "list" && (
          <div className="mb-6">
            <input 
              type="text"
              placeholder="🔍 Search by name or class (e.g. B1, Nursery)..."
              className="w-full p-2 rounded-2xl border-2 border-yellow-200 shadow-sm outline-none focus:border-green-600 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {view === "bulk" && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-yellow-500">
            <h2 className="text-xl font-bold mb-4">Paste Student Names</h2>
            <form onSubmit={handleBulkImport} className="grid gap-4">
              <textarea className="w-full h-48 border-2 p-4 rounded-xl focus:border-green-600 outline-none font-mono text-sm" placeholder="Enter names..." value={bulkData} onChange={(e) => setBulkData(e.target.value)} required />
              <div className="grid grid-cols-2 gap-4">
                <select onChange={(e) => setForm({...form, category: e.target.value})} required className="border-2 p-2 rounded-xl outline-none">
                  <option value="">Select Category</option>
                  {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select onChange={(e) => setForm({...form, subCategory: e.target.value})} required className="border-2 p-3 rounded-xl outline-none">
                  <option value="">Select Class</option>
                  {form.category && categories[form.category].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-green-700 text-white py-3 rounded-xl font-bold uppercase hover:bg-green-800 transition shadow-lg">Start Import</button>
            </form>
          </div>
        )}

        {view === "promote" && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-blue-600">
            <h2 className="text-xl font-bold mb-4 text-blue-800">Move Students to Next Class</h2>
            <form onSubmit={triggerPromote} className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs font-bold text-gray-400">FROM CLASS</label>
                <select value={promo.from} onChange={(e) => setPromo({...promo, from: e.target.value})} required className="w-full border-2 p-2 rounded-xl outline-none">
                  <option value="">-- From --</option>
                  {allSubCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">TO CLASS</label>
                <select value={promo.to} onChange={(e) => setPromo({...promo, to: e.target.value})} required className="w-full border-2 p-2 rounded-xl outline-none">
                  <option value="">-- To --</option>
                  {allSubCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-blue-600 text-white py-3 rounded-xl font-bold uppercase hover:bg-blue-700 transition shadow-lg">Execute Promotion</button>
            </form>
          </div>
        )}

        {view === "graduate" && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-red-600">
            <h2 className="text-xl font-bold mb-2 text-red-800">Archive Graduating Class</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium uppercase tracking-wider">⚠️ Action moves students to archive</p>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <select value={gradClass} onChange={(e) => setGradClass(e.target.value)} className="w-full border-2 p-2 rounded-xl outline-none font-bold">
                  <option value="">-- Select Final Class --</option>
                  {allSubCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={triggerGraduate} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold uppercase hover:bg-red-700 transition shadow-lg">Confirm Graduation</button>
            </div>
          </div>
        )}

        {view === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(std => (
              <div key={std._id} className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-green-600 flex flex-col hover:shadow-md transition">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex-1">
                    {editingId === std._id ? (
                      <input 
                        className="w-full border-b-2 border-green-600 outline-none font-bold text-gray-800"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <>
                        <p className="font-bold text-gray-800">{std.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{std.category} • {std.subCategory}</p>
                      </>
                    )}
                  </div>
                  <span className="text-2xl bg-green-50 p-2 rounded-full ml-2">🎓</span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  {editingId === std._id ? (
                    <>
                      <button onClick={() => handleUpdateStudent(std._id)} className="flex-1 text-[10px] font-bold uppercase bg-green-700 text-white py-1.5 rounded-lg">Save</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 text-[10px] font-bold uppercase bg-gray-200 text-gray-700 py-1.5 rounded-lg">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(std)} className="flex-1 text-[10px] font-bold uppercase bg-blue-50 text-blue-700 py-1.5 rounded-lg hover:bg-blue-100 transition">Edit</button>
                      <button onClick={() => triggerDelete(std._id)} className="flex-1 text-[10px] font-bold uppercase bg-red-50 text-red-700 py-1.5 rounded-lg hover:bg-red-100 transition">Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {filteredStudents.length === 0 && (
               <p className="col-span-full text-center text-gray-400 font-bold py-10">No students matching "{searchTerm}"</p>
            )}
          </div>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{modal.title}</h2>
            <p className="text-gray-500 text-sm mb-6">{modal.message}</p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold">Cancel</button>
              <button onClick={handleConfirmAction} className={`flex-1 py-2 text-white rounded-xl font-bold transition ${modal.color}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;