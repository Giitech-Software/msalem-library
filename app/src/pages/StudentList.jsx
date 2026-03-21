import React, { useState, useEffect } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [view, setView] = useState("list"); // 'list', 'bulk', 'promote', 'graduate'
  const [status, setStatus] = useState({ show: false, message: "", type: "" });

  const [form, setForm] = useState({ name: "", category: "", subCategory: "" });
  const [bulkData, setBulkData] = useState("");
  const [promo, setPromo] = useState({ from: "", to: "" });
  const [gradClass, setGradClass] = useState("");

  const categories = {
    Preschool: ["Nursery", "Kg1", "Kg2"],
    "Lower Primary": ["Cl1", "Cl2", "Cl3"],
    "Upper Primary": ["Cl4", "Cl5", "Cl6"],
    JHS: ["JHS1", "JHS2", "JHS3"],
    SHS: ["SHS1", "SHS2", "SHS3"]
  };

  const allSubCategories = Object.values(categories).flat();

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/students");
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    const nameArray = bulkData.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
    try {
      await axios.post("http://localhost:5000/api/students/bulk", {
        names: nameArray,
        category: form.category,
        subCategory: form.subCategory
      });
      showStatus(`Successfully imported ${nameArray.length} students!`, "success");
      setBulkData("");
      setView("list");
      fetchStudents();
    } catch (err) { showStatus("Import failed.", "error"); }
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Promote all from ${promo.from} to ${promo.to}?`)) return;
    try {
      const res = await axios.post("http://localhost:5000/api/students/promote", {
        fromSubCategory: promo.from,
        toSubCategory: promo.to
      });
      showStatus(res.data.message, "success");
      fetchStudents();
      setView("list");
    } catch (err) { showStatus("Promotion failed.", "error"); }
  };

  const handleGraduate = async () => {
    if (!gradClass) return showStatus("Select a class first", "error");
    if (!window.confirm(`Move all ${gradClass} students to Archive?`)) return;
    try {
      const res = await axios.post("http://localhost:5000/api/students/graduate", {
        subCategory: gradClass
      });
      showStatus(res.data.message, "success");
      fetchStudents();
      setView("list");
    } catch (err) { showStatus("Graduation failed.", "error"); }
  };

  const showStatus = (msg, type) => {
    setStatus({ show: true, message: msg, type });
    setTimeout(() => setStatus({ show: false }), 4000);
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" />
      
      {status.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl text-white font-bold ${status.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {status.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-black text-green-800 uppercase tracking-tight">👥 Student Registry</h1>
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-md border border-yellow-200">
            <button onClick={() => setView("list")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'list' ? 'bg-green-700 text-white' : 'text-green-700 hover:bg-green-50'}`}>View All</button>
            <button onClick={() => setView("bulk")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'bulk' ? 'bg-yellow-500 text-white' : 'text-yellow-600 hover:bg-yellow-50'}`}>Bulk Import</button>
            <button onClick={() => setView("promote")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'promote' ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}>Promote</button>
            <button onClick={() => setView("graduate")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'graduate' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'}`}>Graduate</button>
          </div>
        </div>

        {/* VIEW: BULK IMPORT */}
        {view === "bulk" && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-yellow-500 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4">Paste Student Names</h2>
            <form onSubmit={handleBulkImport} className="grid gap-4">
              <textarea className="w-full h-48 border-2 p-4 rounded-xl focus:border-green-600 outline-none font-mono text-sm" placeholder="Paste names here..." value={bulkData} onChange={(e) => setBulkData(e.target.value)} required />
              <div className="grid grid-cols-2 gap-4">
                <select onChange={(e) => setForm({...form, category: e.target.value})} required className="border-2 p-3 rounded-xl outline-none">
                  <option value="">Select Category</option>
                  {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select onChange={(e) => setForm({...form, subCategory: e.target.value})} required className="border-2 p-3 rounded-xl outline-none">
                  <option value="">Select Class</option>
                  {form.category && categories[form.category].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-green-700 text-white py-4 rounded-xl font-bold uppercase hover:bg-green-800 transition shadow-lg">Start Import</button>
            </form>
          </div>
        )}

        {/* VIEW: PROMOTE */}
        {view === "promote" && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-blue-600 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4 text-blue-800">Move Students to Next Class</h2>
            <form onSubmit={handlePromote} className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs font-bold text-gray-400">FROM CLASS</label>
                <select value={promo.from} onChange={(e) => setPromo({...promo, from: e.target.value})} required className="w-full border-2 p-3 rounded-xl outline-none">
                  <option value="">-- From --</option>
                  {allSubCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">TO CLASS</label>
                <select value={promo.to} onChange={(e) => setPromo({...promo, to: e.target.value})} required className="w-full border-2 p-3 rounded-xl outline-none">
                  <option value="">-- To --</option>
                  {allSubCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-blue-600 text-white py-4 rounded-xl font-bold uppercase hover:bg-blue-700 transition shadow-lg">Execute Promotion</button>
            </form>
          </div>
        )}

        {/* VIEW: GRADUATE */}
        {view === "graduate" && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-red-600 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-2 text-red-800">Archive Graduating Class</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium uppercase tracking-wider">⚠️ Action moves students to archive and clears current registry</p>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <select value={gradClass} onChange={(e) => setGradClass(e.target.value)} className="w-full border-2 p-4 rounded-xl outline-none font-bold">
                  <option value="">-- Select Final Class --</option>
                  {allSubCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={handleGraduate} className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold uppercase hover:bg-red-700 transition shadow-lg">Confirm Graduation</button>
            </div>
          </div>
        )}

        {/* VIEW: LIST (YOUR PREFERRED CARD DESIGN) */}
        {view === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500">
            {students.map(std => (
              <div key={std._id} className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-green-600 flex justify-between items-center hover:shadow-md transition">
                <div>
                  <p className="font-bold text-gray-800">{std.name}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{std.category} • {std.subCategory}</p>
                </div>
                <span className="text-2xl bg-green-50 p-2 rounded-full">🎓</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;