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
    bookType: "Physical",
    basePrice: 0,
    deliveryMethod: "WhatsApp",
    pdfUrl: "", // <--- ADD THIS LINE
  };

  const [form, setForm] = useState(initialFormState);

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

    if (name === "title") {
      setForm(prev => ({ 
        ...prev, 
        title: value, 
        bookType: "Physical", 
        basePrice: 0 
      }));

      const search = value.toLowerCase();
      const matches = catalog
        .filter((book) => book.title && book.title.toLowerCase().includes(search))
        .map(book => {
            const outCount = borrowedRecords.filter(r => r.title === book.title && r.status !== "Returned").length;
            const isDigital = book.bookType === "Digital" || !!book.pdfUrl; 
            return { 
              ...book, 
              available: isDigital ? "∞" : (book.totalQuantity || 0) - outCount, 
              isDigital: isDigital
            };
        })
        .slice(0, 8);
      setFilteredTitles(value ? matches : []);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "borrowerName") {
      const search = value.toLowerCase();
      const combined = [
        ...(students || []).map(s => ({ ...s, type: 'Student' })),
        ...(staff || []).map(s => ({ ...s, type: 'Staff' }))
      ];
      const matches = combined.filter((p) => p.name && p.name.toLowerCase().includes(search)).slice(0, 5);
      setFilteredNames(value ? matches : []);
    }
  };

const handleSelectBook = (b) => {
    const actualType = (b.bookType === "Digital" || b.pdfUrl) ? "Digital" : "Physical";
    setForm(prev => ({
      ...prev,
      title: b.title,
      bookType: actualType,
      basePrice: b.basePrice || 0,
      pdfUrl: b.pdfUrl || "", // <--- ADD THIS LINE
      returnDate: actualType === "Digital" ? "" : prev.returnDate
    }));
    setFilteredTitles([]);
  };

  const handleSelectPerson = (person) => {
    setForm(prev => ({
      ...prev,
      borrowerName: person.name,
      borrowerId: person.studentId || person.staffId || person.borrowerId || "",
      category: person.type === 'Staff' ? 'Staff' : (person.category || "General User"),
      subCategory: person.subCategory || "",
      contact: person.contact || person.phone || person.email || "" 
    }));
    setFilteredNames([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.borrowerId) {
        setStatus({ show: true, message: "A unique Borrower ID is required!", type: "error" });
        return;
    }

    const payload = {
      ...form,
      status: form.bookType === "Digital" ? "Dispatched" : "Borrowed",
      returnDate: form.bookType === "Digital" ? null : form.returnDate
    };

    try {
      // 🟢 FIX 1: Capture the response in 'res'
      const res = await axios.post("http://localhost:5000/api/books/borrow", payload, getAuthHeaders());
      
      // 🟢 FIX 2: Now 'res' is defined, so we can check for waLink
      if (form.bookType === "Digital" && form.deliveryMethod === "WhatsApp" && res.data?.waLink) {
        window.open(res.data.waLink, "_blank"); 
      }

      setForm(initialFormState);
      setFilteredTitles([]);
      setFilteredNames([]);
      
      // 🟢 FIX 3: Use the message from the backend response if it exists
      setStatus({ 
        show: true, 
        message: res.data?.message || (form.bookType === "Digital" ? "Digital Access Dispatched!" : "Book issued successfully!"), 
        type: "success" 
      });
      
      setSubmitCount(prev => prev + 1);
      setTimeout(() => setStatus({ show: false }), 4000);
    } catch (error) {
      // If the code reaches here, axios actually failed
      const msg = error.response?.data?.message || "Error processing request.";
      setStatus({ show: true, message: msg, type: "error" });
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
            
            {form.title && (
              <div className="mt-1 flex gap-2">
                 <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${form.bookType === 'Digital' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                   Mode: {form.bookType}
                 </span>
                 <span className="text-[9px] font-black px-2 py-0.5 rounded bg-yellow-400 text-green-900 uppercase">
                   Cost: ${form.basePrice}
                 </span>
              </div>
            )}

            {filteredTitles.length > 0 && (
              <div className="absolute z-30 bg-white border-2 border-yellow-100 w-full rounded-2xl shadow-2xl mt-1 max-h-64 overflow-y-auto">
                {filteredTitles.map(b => {
                  const noStock = b.available !== "∞" && b.available <= 0;
                  return (
                    <div key={b._id} className={`p-4 border-b last:border-0 flex justify-between items-center transition ${noStock ? 'bg-red-50 opacity-60 cursor-not-allowed' : 'hover:bg-yellow-50 cursor-pointer'}`} 
                      onClick={() => !noStock && handleSelectBook(b)}>
                      <div className="flex-1">
                        <p className="font-black text-gray-800 leading-tight">{b.title}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">{b.author} • {b.category}</p>
                      </div>
                      <div className="text-right ml-4">
                         <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                           b.isDigital ? 'bg-blue-100 text-blue-700 border-blue-200' :
                           noStock ? 'bg-red-600 text-white border-red-700' : 'bg-green-100 text-green-700 border-green-200'
                         }`}>
                            {b.isDigital ? "DIGITAL COPY" : noStock ? "OUT OF STOCK" : `${b.available} AVAILABLE`}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 flex justify-between">
                  Unique ID 
                  <span onClick={generateId} className="text-blue-600 cursor-pointer hover:underline">Auto?</span>
                </label>
                <input name="borrowerId" value={form.borrowerId} onChange={handleChange} required placeholder="STF/STD/GNR-ID" className="w-full border-2 p-2 rounded-xl focus:border-blue-600 outline-none font-black text-blue-700 bg-blue-50/30" />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">
                  {form.bookType === 'Digital' ? `Send via ${form.deliveryMethod}` : "Contact Info"}
                </label>
                <input name="contact" value={form.contact} onChange={handleChange} placeholder={form.bookType === 'Digital' ? "Number or Email" : "Phone/Email"} className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none font-bold" />
              </div>
          </div>

          {/* DIGITAL DELIVERY METHOD SELECTOR */}
          {form.bookType === 'Digital' && (
            <div className="bg-blue-50 p-3 rounded-2xl border-2 border-blue-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-700 uppercase ml-1">Dispatch Via:</span>
              <div className="flex gap-3">
                {['WhatsApp', 'Email'].map(method => (
                  <button key={method} type="button" onClick={() => setForm(prev => ({...prev, deliveryMethod: method}))} 
                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition ${form.deliveryMethod === method ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'}`}>
                    {method.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            
            {/* HIDE RETURN DATE IF DIGITAL */}
            <div className={form.bookType === 'Digital' ? 'opacity-30 pointer-events-none' : ''}>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">
                {form.bookType === 'Digital' ? "No Return Needed" : "Expected Return"}
              </label>
              <input type="date" name="returnDate" value={form.returnDate} min={form.borrowedDate} onChange={handleChange} required={form.bookType !== 'Digital'} className="w-full border-2 p-2 rounded-xl font-bold text-gray-700" />
            </div>
          </div>

          <button type="submit" className={`py-3 rounded-xl font-black text-lg transition shadow-lg mt-2 uppercase tracking-tighter ${form.bookType === 'Digital' ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-green-700 text-yellow-300 hover:bg-green-800'}`}>
            {form.bookType === 'Digital' ? `🚀 Dispatch to ${form.deliveryMethod}` : "Confirm Physical Issuance"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BorrowBook;