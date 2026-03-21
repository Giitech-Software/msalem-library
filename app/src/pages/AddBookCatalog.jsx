//app/src/pages/AddBookCatalog.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton"; 

const AddBookCatalog = () => {
  const navigate = useNavigate();
  
  // ELECTRON FIX: Track form sessions to force a hard refresh of inputs
  const [formSession, setFormSession] = useState(0);
  
  // UI FIX: Custom status message instead of window.alert/confirm
  const [status, setStatus] = useState({ show: false, message: "", type: "" });

  const initialFormState = {
    title: "",
    author: "",
    category: "",
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

    try {
      const existing = await axios.get(
        `http://localhost:5000/api/bookCatalog/search?title=${encodeURIComponent(form.title)}`
      );
      
      if (existing.data && existing.data.exists) {
        setStatus({ show: true, message: "This title already exists!", type: "error" });
        return;
      }

      await axios.post("http://localhost:5000/api/bookCatalog/add", form);

      // Reset state and session
      setForm(initialFormState);
      setFormSession(prev => prev + 1);

      // Show Success Notification
      setStatus({ show: true, message: "Book added to catalog!", type: "success" });

      // Clear message after 4 seconds
      setTimeout(() => setStatus({ show: false, message: "", type: "" }), 4000);
      
    } catch (err) {
      console.error("Failed to add book:", err);
      setStatus({ show: true, message: "Error adding book. Try again.", type: "error" });
    }
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" />
      
      {/* CUSTOM UI NOTIFICATION (Matching Borrow Form Style) */}
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

      <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">
        ➕📚 Add New Book Title
      </h1>
      
      <form
        key={`add-catalog-session-${formSession}`}
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 max-w-xl mx-auto border-t-8 border-green-700"
      >
        <div className="grid gap-4">
          
          {/* Title Field */}
          <div>
            <label className="text-xs font-bold text-gray-400">BOOK TITLE</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              autoComplete="off"
              placeholder="Enter full book title..."
              className="w-full border-2 p-3 rounded-xl focus:border-green-600 outline-none transition-all"
            />
          </div>

          {/* Author Field */}
          <div>
            <label className="text-xs font-bold text-gray-400">AUTHOR</label>
            <input
  name="author"
  value={form.author}
  onChange={handleChange}
  required
              autoComplete="off"
              placeholder="Author's name"
              className="w-full border-2 p-3 rounded-xl focus:border-green-600 outline-none transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="text-xs font-bold text-gray-400">BOOK CATEGORY</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full border-2 p-3 rounded-xl focus:border-green-600 outline-none transition-all bg-white"
            >
              <option value="">Select Category</option>
              <option value="Textbook">Textbook</option>
              <option value="Storybook">Storybook</option>
              <option value="Reference">Reference</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
             <label className="text-xs font-bold text-gray-400">
  ISBN <span className="text-gray-400">(Optional)</span>
</label>
              <input
                name="isbn"
                value={form.isbn}
                onChange={handleChange}
                autoComplete="off"
                placeholder="ISBN Number"
                className="w-full border-2 p-3 rounded-xl focus:border-green-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400">
  PUB. YEAR <span className="text-gray-400">(Optional)</span>
</label>
              <input
                name="publishedYear"
                value={form.publishedYear}
                onChange={handleChange}
                autoComplete="off"
                placeholder="e.g. 2024"
                className="w-full border-2 p-3 rounded-xl focus:border-green-600 outline-none transition-all"
              />
            </div>
          </div>

          <div>
           <label className="text-xs font-bold text-gray-400">
  DESCRIPTION / NOTES <span className="text-gray-400">(Optional)</span>
</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief summary of the book..."
              className="w-full border-2 p-3 rounded-xl h-28 focus:border-green-600 outline-none transition-all"
            ></textarea>
          </div>

          <button
            type="submit"
            className="bg-green-700 text-yellow-300 py-4 rounded-xl font-black text-lg hover:bg-green-800 transition shadow-lg mt-4 uppercase"
          >
            Add to Catalog
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBookCatalog;