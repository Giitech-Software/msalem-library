import React, { useState, useRef } from "react";
// ✅ Using centralized API instance
import API from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton"; 

const AddBookCatalog = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [formSession, setFormSession] = useState(0);
  const [status, setStatus] = useState({ show: false, message: "", type: "" });
  const [pdfFile, setPdfFile] = useState(null);

  const initialFormState = {
    title: "",
    author: "",
    category: "",
    totalQuantity: "",
    isbn: "",
    publishedYear: "",
    description: "",
    basePrice: "0", 
  };
  
  const [form, setForm] = useState(initialFormState);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title) {
        setStatus({ show: true, message: "Book Title is required to identify the entry.", type: "error" });
        return;
    }

    try {
      const existing = await API.get(
        `/bookCatalog/search?title=${encodeURIComponent(form.title)}`
      );
      
      if (existing.data && existing.data.length > 0) {
        setStatus({ show: true, message: "This title already exists in the catalog!", type: "error" });
        return;
      }

      let payload;
      let config = {}; 

      // ✅ FINANCIAL UPDATE: Map basePrice to borrowingCost for the database
      const financialData = {
        ...form,
        borrowingCost: form.basePrice // This ensures the amount is saved correctly
      };

      if (pdfFile) {
        payload = new FormData();
        Object.keys(financialData).forEach(key => payload.append(key, financialData[key]));
        payload.append("pdf", pdfFile);
        payload.append("bookType", "Digital");
        payload.set("totalQuantity", "999999"); 
        
        config.headers = { "Content-Type": "multipart/form-data" };
      } else {
        payload = { ...financialData, bookType: "Physical" };
      }

      await API.post("/bookCatalog/add", payload, config);

      setForm(initialFormState);
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFormSession(prev => prev + 1);
      setStatus({ show: true, message: "Book successfully added to catalog!", type: "success" });

      setTimeout(() => setStatus({ show: false, message: "", type: "" }), 4000);
      
    } catch (err) {
      console.error("Failed to add book:", err);
      const errorMsg = err.response?.data?.message || "Error adding book. Ensure file is a valid PDF.";
      setStatus({ show: true, message: errorMsg, type: "error" });
    }
  };

  return (
    <div className="p-8 bg-yellow-50 border-2 border-yellow-200 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" />
      
      {status.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-2xl animate-bounce ${
          status.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <span className="font-bold">{status.message}</span>
            <button onClick={() => setStatus({show: false})} className="ml-2 hover:opacity-70">✕</button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-black text-green-700 mb-6 text-center uppercase tracking-tight italic underline decoration-yellow-400"> 
        ➕📚 Add New Catalog Item
      </h1>
      
      <form
        key={`add-catalog-session-${formSession}`}
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 max-w-xl mx-auto border-t-8 border-green-700"
      >
        <div className="grid gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Book Title</label>
            <input 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                placeholder="eg. The Adventures of Sherlock Holmes"
                className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none" 
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Author</label>
            <input 
                name="author" 
                value={form.author} 
                onChange={handleChange} 
                placeholder="eg. Arthur Conan Doyle"
                className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">ISBN (Optional)</label>
              <input 
                name="isbn" 
                value={form.isbn} 
                onChange={handleChange} 
                placeholder="eg. 978-3-16..."
                className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">Published Year</label>
              <input 
                type="number" 
                name="publishedYear" 
                value={form.publishedYear} 
                onChange={handleChange} 
                placeholder="eg. 2024"
                className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none" 
              />
            </div>
          </div>

          <div className="p-4 border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl">
            <label className="text-xs font-black text-blue-700 uppercase block mb-1">
              Digital Copy (Optional PDF)
            </label>
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".pdf" 
              onChange={(e) => setPdfFile(e.target.files[0])}
              className="text-xs text-gray-600 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full border-2 p-2 rounded-xl bg-white">
                <option value="">Select...</option>
                <option value="Textbook">Textbook</option>
                <option value="Storybook">Storybook</option>
                <option value="Reference">Reference</option>
                <option value="Novel">Novel</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-blue-600 uppercase italic">Borrowing Cost ($)</label>
              <input 
                type="number" 
                name="basePrice" 
                value={form.basePrice} 
                onChange={handleChange} 
                placeholder="0.00"
                className="w-full border-2 border-blue-100 p-2 rounded-xl font-bold focus:border-blue-500 outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Description</label>
            <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                rows="3" 
                className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none resize-none" 
                placeholder="eg. A classic collection of detective stories..."
            ></textarea>
          </div>

          {!pdfFile && (
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">Physical Quantity</label>
              <input 
                type="number" 
                name="totalQuantity" 
                value={form.totalQuantity} 
                onChange={handleChange} 
                min="1" 
                placeholder="eg. 10"
                className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none" 
              />
            </div>
          )}

          <button
            type="submit"
            className={`py-3 rounded-xl font-black text-lg transition shadow-lg mt-4 uppercase ${pdfFile ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-green-700 text-yellow-300 hover:bg-green-800'}`}
          >
            {pdfFile ? "🚀 Upload Digital Book" : "➕ Add to Catalog"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBookCatalog;