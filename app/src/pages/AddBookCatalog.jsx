import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton"; 

const AddBookCatalog = () => {
  const navigate = useNavigate();
  
  const [formSession, setFormSession] = useState(0);
  const [status, setStatus] = useState({ show: false, message: "", type: "" });

  const initialFormState = {
    title: "",
    author: "",
    category: "",
    totalQuantity: "",
    isbn: "",
    publishedYear: "",
    description: "",
  };
  
  const [form, setForm] = useState(initialFormState);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Get the token from local storage
    const token = localStorage.getItem("token");

    try {
      // 2. Check for duplicates using search (Backend returns an array)
      const existing = await axios.get(
        `http://localhost:5000/api/bookCatalog/search?title=${encodeURIComponent(form.title)}`
      );
      
      // If the array contains any items, the book already exists
      if (existing.data && existing.data.length > 0) {
        setStatus({ show: true, message: "This title already exists in the catalog!", type: "error" });
        return;
      }

      // 3. Post to backend with Authorization headers
      await axios.post(
        "http://localhost:5000/api/bookCatalog/add", 
        form,
        {
          headers: {
            Authorization: `Bearer ${token}` // ✅ Required for auth middleware
          }
        }
      );

      setForm(initialFormState);
      setFormSession(prev => prev + 1);
      setStatus({ show: true, message: "Book added to catalog!", type: "success" });

      setTimeout(() => setStatus({ show: false, message: "", type: "" }), 4000);
      
    } catch (err) {
      console.error("Failed to add book:", err);
      
      // Check if it's a 401 Unauthorized error
      const errorMsg = err.response?.status === 401 
        ? "Session expired. Please log in again." 
        : "Error adding book. Try again.";

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
            {status.type === 'success' && (
               <button 
                onClick={() => navigate("/book-catalog")}
                className="bg-white text-green-700 px-2 py-1 rounded text-xs font-bold uppercase hover:bg-yellow-100"
               >
                 View Catalog
               </button>
            )}
            <button onClick={() => setStatus({show: false})} className="ml-2 hover:opacity-70">✕</button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-black text-green-700 mb-6 text-center uppercase tracking-tight italic underline decoration-yellow-400"> ➕📚 Add New Book Title</h1>
      
      
      <form
        key={`add-catalog-session-${formSession}`}
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 max-w-xl mx-auto border-t-8 border-green-700"
      >
        <div className="grid gap-4">
          
          <div>
            <label className="text-xs font-bold text-gray-600">BOOK TITLE</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              autoComplete="off"
              placeholder="Enter full book title..."
              className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600">AUTHOR</label>
            <input
              name="author"
              value={form.author}
              onChange={handleChange}
              required
              autoComplete="off"
              placeholder="Author's name"
              className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600">BOOK CATEGORY</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none transition-all bg-white"
              >
                <option value="">Select Category</option>
                <option value="Textbook">Textbook</option>
                <option value="Storybook">Storybook</option>
                <option value="Reference">Reference</option>
                <option value="Novel">Novel</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">TOTAL QUANTITY</label>
              <input
                type="number"
                name="totalQuantity"
                value={form.totalQuantity}
                onChange={handleChange}
                required
                min="1"
                placeholder="Total Books"
                className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
             <label className="text-xs font-bold text-gray-600">
              ISBN <span className="text-gray-600">(Optional)</span>
            </label>
              <input
                name="isbn"
                value={form.isbn}
                onChange={handleChange}
                autoComplete="off"
                placeholder="ISBN Number"
                className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">
                PUB. YEAR <span className="text-gray-600">(Optional)</span>
              </label>
              <input
                name="publishedYear"
                value={form.publishedYear}
                onChange={handleChange}
                autoComplete="off"
                placeholder="e.g. 2024"
                className="w-full border-2 p-2 rounded-xl focus:border-green-600 outline-none transition-all"
              />
            </div>
          </div>

          <div>
           <label className="text-xs font-bold text-gray-600">
            DESCRIPTION / NOTES <span className="text-gray-600">(Optional)</span>
          </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief summary of the book..."
              className="w-full border-2 p-2 rounded-xl h-28 focus:border-green-600 outline-none transition-all"
            ></textarea>
          </div>

          <button
            type="submit"
            className="bg-green-700 text-yellow-300 py-3 rounded-xl font-black text-lg hover:bg-green-800 transition shadow-lg mt-4 uppercase"
          >
            Add to Catalog
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBookCatalog;