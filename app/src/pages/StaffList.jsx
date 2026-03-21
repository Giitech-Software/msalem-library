import React, { useState, useEffect } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [view, setView] = useState("list");
  const [bulkNames, setBulkNames] = useState("");
  const [status, setStatus] = useState({ show: false, message: "", type: "" });

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/staff");
      setStaff(res.data);
    } catch (err) { console.error(err); }
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    const names = bulkNames.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
    try {
      await axios.post("http://localhost:5000/api/staff/bulk", { names });
      showStatus(`Successfully added ${names.length} staff members!`, "success");
      setBulkNames("");
      setView("list");
      fetchStaff();
    } catch (err) { 
      showStatus("Error adding staff members.", "error");
    }
  };

  const showStatus = (msg, type) => {
    setStatus({ show: true, message: msg, type });
    setTimeout(() => setStatus({ show: false }), 4000);
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" />
      
      {status.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl text-white font-bold ${status.type === 'success' ? 'bg-green-700' : 'bg-red-600'}`}>
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

        {view === 'add' ? (
          <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-green-700 animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-bold mb-2 text-green-800">Registration Portal</h2>
            <p className="text-sm text-gray-500 mb-6">Enter staff names separated by lines or commas.</p>
            <form onSubmit={handleBulkAdd}>
              <textarea 
                className="w-full h-64 border-2 p-4 rounded-2xl focus:border-green-600 outline-none mb-4 bg-gray-50 font-mono text-sm"
                placeholder="Mr. Thompson&#10;Madam Elizabeth&#10;Coach Adams..."
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                required
              />
              <button className="w-full bg-green-700 text-yellow-300 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-green-800 transition">
                Register Staff Members
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500">
            {staff.map(s => (
              <div key={s._id} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-yellow-500 flex justify-between items-center hover:shadow-md transition group">
                <div>
                  <p className="font-bold text-gray-800 group-hover:text-green-700 transition">{s.name}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Official Staff</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded-full text-xl group-hover:bg-yellow-100 transition">
                  👤
                </div>
              </div>
            ))}
            
            {staff.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-widest">No staff records found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffList;