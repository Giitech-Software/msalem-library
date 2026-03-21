import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton"; 

const BorrowBook = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  
  const [filteredTitles, setFilteredTitles] = useState([]);
  const [filteredNames, setFilteredNames] = useState([]);
  
  const [submitCount, setSubmitCount] = useState(0);
  const [status, setStatus] = useState({ show: false, message: "", type: "" });

  const today = new Date().toISOString().split('T')[0];

  const initialFormState = {
    title: "",
    borrowerName: "",
    category: "",
    subCategory: "",
    borrowedDate: today,
    returnDate: "",
    contact: "",
  };

  const [form, setForm] = useState(initialFormState);

  const categoryOptions = {
    Preschool: ["Nursery", "Kg1", "Kg2"],
    "Lower Primary": ["Cl1", "Cl2", "Cl3"],
    "Upper Primary": ["Cl4", "Cl5", "Cl6"],
    JHS: ["JHS1", "JHS2", "JHS3"],
    SHS: ["SHS1", "SHS2", "SHS3"],
    Staff: ["Teaching", "Non-Teaching", "Management"],
  };

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [catRes, stdRes, stfRes] = await Promise.allSettled([
          axios.get("http://localhost:5000/api/bookCatalog"),
          axios.get("http://localhost:5000/api/students"),
          axios.get("http://localhost:5000/api/staff")
        ]);

        if (catRes.status === 'fulfilled') setCatalog(catRes.value.data);
        if (stdRes.status === 'fulfilled') setStudents(stdRes.value.data);
        if (stfRes.status === 'fulfilled') setStaff(stfRes.value.data);
      } catch (err) {
        console.error("Data load error:", err);
      }
    };
    loadAllData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // --- DATE VALIDATION LOGIC ---
    if (name === "returnDate" && form.borrowedDate && value <= form.borrowedDate) {
        setStatus({ show: true, message: "Return date must be after borrowed date!", type: "error" });
        setTimeout(() => setStatus({ show: false }), 3000);
        return; // Don't update state if invalid
    }

    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "title") {
      const search = value.toLowerCase();
      const matches = catalog
        .filter((book) => book.title && book.title.toLowerCase().includes(search))
        .slice(0, 8);
      setFilteredTitles(value ? matches : []);
    }

    if (name === "borrowerName") {
      const search = value.toLowerCase();
      const combined = [
        ...students.map(s => ({ ...s, type: 'Student' })),
        ...staff.map(s => ({ ...s, type: 'Staff' }))
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
      category: person.type === 'Staff' ? 'Staff' : person.category,
      subCategory: person.subCategory || ""
    }));
    setFilteredNames([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final Validation Guard
    if (form.returnDate <= form.borrowedDate) {
        setStatus({ show: true, message: "Check dates: Return date is too early!", type: "error" });
        return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/books/borrow", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setForm(initialFormState);
      setFilteredTitles([]);
      setFilteredNames([]);
      setStatus({ show: true, message: "Book issued successfully!", type: "success" });
      setSubmitCount(prev => prev + 1);
      setTimeout(() => setStatus({ show: false }), 4000);
    } catch (error) {
      setStatus({ show: true, message: "Error issuing book.", type: "error" });
    }
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" />
      
      {status.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-2xl animate-bounce ${
          status.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {status.message}
        </div>
      )}

      <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">📖 Issue New Book</h1>
      
      <form key={submitCount} onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 max-w-xl mx-auto border-t-8 border-green-700">
        <div className="grid gap-4">
          
          <div className="relative">
            <label className="text-xs font-bold text-gray-400">BOOK TITLE</label>
            <input name="title" value={form.title} onChange={handleChange} required autoComplete="off" placeholder="Start typing book title..." className="w-full border-2 p-3 rounded-xl focus:border-green-600 outline-none" />
            {filteredTitles.length > 0 && (
              <div className="absolute z-30 bg-white border w-full rounded-xl shadow-2xl mt-1 max-h-48 overflow-y-auto">
                {filteredTitles.map(b => (
                  <div key={b._id} className="p-3 hover:bg-yellow-100 cursor-pointer border-b last:border-0" onClick={() => { setForm({...form, title: b.title}); setFilteredTitles([]); }}>
                    <p className="font-bold text-gray-800">{b.title}</p>
                    <p className="text-xs text-gray-500">{b.author}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="text-xs font-bold text-gray-400">BORROWER NAME (STUDENT/STAFF)</label>
            <input name="borrowerName" value={form.borrowerName} onChange={handleChange} required autoComplete="off" placeholder="Search registered names..." className="w-full border-2 p-3 rounded-xl focus:border-green-600 outline-none" />
            {filteredNames.length > 0 && (
              <div className="absolute z-30 bg-white border w-full rounded-xl shadow-2xl mt-1">
                {filteredNames.map(p => (
                  <div key={p._id} className="p-3 hover:bg-green-100 cursor-pointer border-b flex justify-between items-center" onClick={() => handleSelectPerson(p)}>
                    <span className="font-bold">{p.name}</span>
                    <span className="text-[10px] bg-green-700 text-white px-2 py-1 rounded-full uppercase">{p.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select name="category" value={form.category} onChange={handleChange} required className="border-2 p-3 rounded-xl outline-none focus:border-green-600">
              <option value="">Category</option>
              {Object.keys(categoryOptions).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select name="subCategory" value={form.subCategory} onChange={handleChange} required className="border-2 p-3 rounded-xl outline-none focus:border-green-600">
              <option value="">Class/Dept</option>
              {form.category && categoryOptions[form.category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400">BORROWED DATE</label>
              <input 
                type="date" 
                name="borrowedDate" 
                value={form.borrowedDate} 
                max={today} // Cannot issue books in the future
                onChange={handleChange} 
                required 
                className="w-full border-2 p-3 rounded-xl" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400">RETURN DUE DATE</label>
              <input 
                type="date" 
                name="returnDate" 
                value={form.returnDate} 
                min={form.borrowedDate} // Must be after or on borrow date
                onChange={handleChange} 
                required 
                className="w-full border-2 p-3 rounded-xl" 
              />
            </div>
          </div>

          <button type="submit" className="bg-green-700 text-yellow-300 py-4 rounded-xl font-black text-lg hover:bg-green-800 transition shadow-lg mt-4 uppercase">
            Confirm Issuance
          </button>
        </div>
      </form>
    </div>
  );
};

export default BorrowBook;