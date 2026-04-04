import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton"; 

const BorrowBook = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [borrowedRecords, setBorrowedRecords] = useState([]); 
  
  const [filteredTitles, setFilteredTitles] = useState([]);
  const [filteredNames, setFilteredNames] = useState([]);
  
  const [submitCount, setSubmitCount] = useState(0);
  const [status, setStatus] = useState({ show: false, message: "", type: "" });

  const today = new Date().toISOString().split('T')[0];

  const initialFormState = {
    title: "",
    borrowerName: "",
    borrowerId: "", 
    category: "",
    subCategory: "",
    borrowedDate: today,
    returnDate: "",
    contact: "", 
  };

  const [form, setForm] = useState(initialFormState);

  // UPDATED: Added General User category
  const categoryOptions = {
    Preschool: ["Nursery", "Kg1", "Kg2"],
    "Lower Primary": ["B1", "B2", "B3"],
    "Upper Primary": ["B4", "B5", "B6"],
    JHS: ["JHS1", "JHS2", "JHS3"],
    SHS: ["SHS1", "SHS2", "SHS3"],
    Staff: ["Teaching", "Non-Teaching", "Management"],
    "General User": ["Community Member", "Parent", "Visitor", "Alumni"], 
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const config = getAuthHeaders();
        const [catRes, stdRes, stfRes, borrowRes] = await Promise.allSettled([
          axios.get("http://localhost:5000/api/bookCatalog", config),
          axios.get("http://localhost:5000/api/students", config),
          axios.get("http://localhost:5000/api/staff", config),
          axios.get("http://localhost:5000/api/books/borrowed", config) 
        ]);

        if (catRes.status === 'fulfilled') setCatalog(catRes.value.data || []);
        if (stdRes.status === 'fulfilled') setStudents(stdRes.value.data || []);
        if (stfRes.status === 'fulfilled') setStaff(stfRes.value.data || []);
        if (borrowRes.status === 'fulfilled') setBorrowedRecords(borrowRes.value.data || []);
      } catch (err) {
        console.error("Data load error:", err);
      }
    };
    loadAllData();
  }, [submitCount]);

  // UPDATED: Added GNR prefix for General users
  const generateId = () => {
    let prefix = "STD";
    if (form.category === "Staff") prefix = "STF";
    if (form.category === "General User") prefix = "GNR";
    
    const random = Math.floor(1000 + Math.random() * 9000);
    const newId = `${prefix}-${random}`;
    setForm(prev => ({ ...prev, borrowerId: newId }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "returnDate" && form.borrowedDate && value <= form.borrowedDate) {
        setStatus({ show: true, message: "Return date must be after borrowed date!", type: "error" });
        return; 
    }

    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "title") {
      const search = value.toLowerCase();
      const matches = catalog
        .filter((book) => book.title && book.title.toLowerCase().includes(search))
        .map(book => {
            const outCount = borrowedRecords.filter(r => r.title === book.title && r.status !== "Returned").length;
            return { ...book, available: (book.totalQuantity || 0) - outCount, borrowed: outCount };
        })
        .slice(0, 8);
      setFilteredTitles(value ? matches : []);
    }

    if (name === "borrowerName") {
      const search = value.toLowerCase();
      const combined = [
        ...(students || []).map(s => ({ ...s, type: 'Student' })),
        ...(staff || []).map(s => ({ ...s, type: 'Staff' }))
      ];
      const matches = combined
        .filter((p) => p.name && p.name.toLowerCase().includes(search))
        .slice(0, 5);
      setFilteredNames(value ? matches : []);
    }
  };

  const handleSelectPerson = (person) => {
    setForm(prev => ({
      ...prev,
      borrowerName: person.name,
      borrowerId: person.studentId || person.staffId || person.borrowerId || "",
      category: person.type === 'Staff' ? 'Staff' : (person.category || "General User"),
      subCategory: person.subCategory || "",
      contact: person.contact || person.phone || "" 
    }));
    setFilteredNames([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.borrowerId) {
        setStatus({ show: true, message: "A unique Borrower ID is required!", type: "error" });
        return;
    }

    try {
      await axios.post("http://localhost:5000/api/books/borrow", form, getAuthHeaders());
      setForm(initialFormState);
      setFilteredTitles([]);
      setFilteredNames([]);
      setStatus({ show: true, message: "Book issued successfully!", type: "success" });
      setSubmitCount(prev => prev + 1);
      setTimeout(() => setStatus({ show: false }), 4000);
    } catch (error) {
      const backendMessage = error.response?.data?.message || error.response?.data;
      const msg = error.response?.status === 401 
        ? "Session expired. Log in again." 
        : (backendMessage || "Error issuing book.");
      
      setStatus({ show: true, message: msg, type: "error" });
      setTimeout(() => setStatus({ show: false, message: "", type: "" }), 6000);
    }
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen border-2 border-yellow-200">
      <BackButton label="⬅ Return to Dashboard" />
      
      {status.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-2xl flex items-center gap-4 animate-bounce ${
          status.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span className="font-bold">{status.message}</span>
          <button onClick={() => setStatus({ show: false })} className="bg-white bg-opacity-20 hover:bg-opacity-40 rounded-full h-6 w-6 flex items-center justify-center text-xs font-black">✕</button>
        </div>
      )}

      <h1 className="text-3xl font-black text-green-700 mb-6 text-center uppercase tracking-tight italic underline decoration-yellow-400">📖 Smart Issuance Portal</h1>
      
      <form key={submitCount} onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-3xl p-8 max-w-xl mx-auto border-t-8 border-green-700">
        <div className="grid gap-5">
          
          <div className="relative">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Live Book Inventory</label>
            <input name="title" value={form.title} onChange={handleChange} required autoComplete="off" placeholder="Search by title..." className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none font-bold" />
            
            {filteredTitles.length > 0 && (
              <div className="absolute z-30 bg-white border-2 border-yellow-100 w-full rounded-2xl shadow-2xl mt-1 max-h-64 overflow-y-auto">
                {filteredTitles.map(b => {
                  const noStock = b.available <= 0;
                  return (
                    <div key={b._id} className={`p-4 border-b last:border-0 flex justify-between items-center transition ${noStock ? 'bg-red-50 opacity-60 cursor-not-allowed' : 'hover:bg-yellow-50 cursor-pointer'}`} 
                      onClick={() => {
                        if (noStock) return;
                        setForm({...form, title: b.title}); 
                        setFilteredTitles([]); 
                      }}>
                      <div className="flex-1">
                        <p className="font-black text-gray-800 leading-tight">{b.title}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">{b.author} • {b.category}</p>
                      </div>
                      <div className="text-right ml-4">
                         <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${noStock ? 'bg-red-600 text-white border-red-700' : 'bg-green-100 text-green-700 border-green-200'}`}>
                            {noStock ? "OUT OF STOCK" : `${b.available} AVAILABLE`}
                         </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="border-dashed border-gray-100" />

          <div className="relative">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Borrower Name</label>
            <input name="borrowerName" value={form.borrowerName} onChange={handleChange} required autoComplete="off" placeholder="Search name..." className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none font-bold" />
            {filteredNames.length > 0 && (
              <div className="absolute z-30 bg-white border-2 border-green-100 w-full rounded-2xl shadow-2xl mt-1">
                {filteredNames.map(p => (
                  <div key={p._id} className="p-3 hover:bg-green-50 cursor-pointer border-b flex justify-between items-center" onClick={() => handleSelectPerson(p)}>
                    <span className="font-bold text-gray-800">{p.name}</span>
                    <div className="flex gap-2">
                        <span className="text-[8px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-bold italic">{p.studentId || p.staffId}</span>
                        <span className="text-[9px] bg-green-700 text-white px-2 py-1 rounded-md uppercase font-black">{p.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 flex justify-between">
              Unique ID (STF/STD/GNR) 
              <span onClick={generateId} className="text-blue-600 cursor-pointer hover:underline">Auto-Generate?</span>
            </label>
            <input name="borrowerId" value={form.borrowerId} onChange={handleChange} required placeholder="Enter ID (e.g. GNR-1234)" className="w-full border-2 p-2 rounded-xl focus:border-blue-600 outline-none font-black text-blue-700 bg-blue-50/30" />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Contact Info (Required for Public)</label>
            <input name="contact" value={form.contact} onChange={handleChange} placeholder="Phone or Email" className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none font-bold" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Category</label>
               <select name="category" value={form.category} onChange={handleChange} required className="w-full border-2 p-2 rounded-xl outline-none focus:border-green-600 font-bold bg-gray-50">
                 <option value="">-- Select --</option>
                 {Object.keys(categoryOptions).map(cat => <option key={cat} value={cat}>{cat}</option>)}
               </select>
            </div>
            <div>
               <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Sub-Category</label>
               <select name="subCategory" value={form.subCategory} onChange={handleChange} required className="w-full border-2 p-2 rounded-xl outline-none focus:border-green-600 font-bold bg-gray-50">
                 <option value="">-- Select --</option>
                 {form.category && categoryOptions[form.category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
               </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Date Borrowed</label>
              <input type="date" name="borrowedDate" value={form.borrowedDate} max={today} onChange={handleChange} required className="w-full border-2 p-2 rounded-xl font-bold text-gray-700" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Expected Return</label>
              <input type="date" name="returnDate" value={form.returnDate} min={form.borrowedDate} onChange={handleChange} required className="w-full border-2 p-2 rounded-xl font-bold text-gray-700" />
            </div>
          </div>

          <button type="submit" className="bg-green-700 text-yellow-300 py-3 rounded-xl font-black text-lg hover:bg-green-800 transition shadow-lg mt-2 uppercase tracking-tighter">
            Confirm Issuance
          </button>
        </div>
      </form>
    </div>
  );
};

export default BorrowBook;