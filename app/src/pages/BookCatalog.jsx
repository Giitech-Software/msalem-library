import React, { useState, useEffect } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

const BookCatalog = () => {
  const [catalog, setCatalog] = useState([]);
  const [borrowedRecords, setBorrowedRecords] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [adminAuth, setAdminAuth] = useState({ email: "", password: "" });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token || ""}` } };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const config = getAuthHeaders();
      const [catRes, borrowRes] = await Promise.allSettled([
        axios.get("http://localhost:5000/api/bookCatalog", config),
        axios.get("http://localhost:5000/api/books/borrowed", config)
      ]);

      if (catRes.status === 'fulfilled') setCatalog(catRes.value.data || []);
      if (borrowRes.status === 'fulfilled') setBorrowedRecords(borrowRes.value.data || []);
      
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  const filteredCatalog = (catalog || []).filter((book) => {
    const title = book?.title?.toLowerCase() || "";
    const author = book?.author?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return title.includes(search) || author.includes(search);
  });

  const openDeleteModal = (id) => {
    setSelectedBookId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedBookId(null);
    setAdminAuth({ email: "", password: "" });
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `http://localhost:5000/api/bookCatalog/delete/${selectedBookId}`,
        { email: adminAuth.email, password: adminAuth.password },
        getAuthHeaders()
      );
      fetchData();
      closeDeleteModal();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  const handleEdit = (book) => {
    setEditing(book._id);
    setEditForm(book);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5000/api/bookCatalog/${editing}`,
        editForm,
        getAuthHeaders()
      );
      setEditing(null);
      fetchData();
    } catch (err) {
      alert("Update failed.");
    }
  };

  return (
    <div className="p-8 bg-yellow-50 min-h-screen border-2 border-yellow-200 relative font-sans">
      <BackButton label="⬅ Return to Dashboard" />
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-black text-green-700 uppercase tracking-tighter italic">
          📘 Live Inventory Management
        </h1>

        <div className="w-full max-w-xs relative">
          <input
            type="text"
            placeholder="Search by title or author..."
            className="w-full pl-6 pr-4 py-2 rounded-2xl border-2 border-green-400 focus:border-green-600 outline-none transition-all shadow-md font-bold text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white p-2 rounded-3xl shadow-xl overflow-hidden border-2 border-yellow-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-green-700 text-yellow-300 uppercase text-xs tracking-widest">
              <th className="py-2 px-4">Book Information</th>
              <th className="py-2 px-4">Category & Format</th>
              <th className="py-2 px-4 text-center">Avg. Fee</th>
              <th className="py-2 px-4 text-center">Live Stock</th>
              <th className="py-2 px-4 text-center">Status</th>
              <th className="py-2 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredCatalog.length > 0 ? (
              filteredCatalog.map((book) => {
                const borrowedCount = (borrowedRecords || []).filter(
                  (r) => r.title === book.title && r.returned !== true
                ).length;
                
                const total = book.totalQuantity || 0;
                const available = total - borrowedCount;
                const isDigital = book.bookType === 'Digital';

                return (
                  <tr key={book._id} className="hover:bg-yellow-50/30 transition-colors">
                    {editing === book._id ? (
                      <>
                        <td className="py-0.5 px-4">
                          <input name="title" value={editForm.title} onChange={handleEditChange} className="border-2 p-1 rounded-lg w-full font-bold text-sm mb-1 focus:border-blue-400 outline-none" />
                          <input name="author" value={editForm.author} onChange={handleEditChange} className="border-2 p-1 rounded-lg w-full text-xs outline-none" />
                        </td>
                        <td className="py-0.5 px-4">
                          <select name="category" value={editForm.category} onChange={handleEditChange} className="border-2 p-1 rounded-lg w-full text-xs font-bold mb-1">
                            <option value="Textbook">Textbook</option>
                            <option value="Storybook">Storybook</option>
                            <option value="Reference">Reference</option>
                            <option value="Novel">Novel</option>
                            <option value="General">General</option>
                          </select>
                          <select name="bookType" value={editForm.bookType} onChange={handleEditChange} className="border-2 p-1 rounded-lg w-full text-[10px] font-black uppercase">
                            <option value="Physical">Physical</option>
                            <option value="Digital">Digital</option>
                          </select>
                        </td>
                        <td className="py-0.5 px-4 text-center">
                          <input type="number" name="basePrice" value={editForm.basePrice} onChange={handleEditChange} className="border-2 p-1 rounded-lg w-16 text-center font-bold text-sm" />
                        </td>
                        <td className="py-0.5 px-4 text-center">
                          {!isDigital && <input type="number" name="totalQuantity" value={editForm.totalQuantity} onChange={handleEditChange} className="border-2 p-1 rounded-lg w-16 text-center font-bold text-sm" />}
                          {isDigital && <span className="text-gray-300 italic text-xs">Unlimited</span>}
                        </td>
                        <td colSpan="2" className="py-0.5 px-4 text-right">
                          <button onClick={handleEditSubmit} className="bg-green-600 text-white py-1.5 px-4 rounded-lg font-black text-[10px] uppercase hover:bg-green-700 shadow-sm active:scale-95 transition-all mr-2">Save</button>
                          <button onClick={() => setEditing(null)} className="bg-gray-200 text-gray-700 py-1.5 px-4 rounded-lg font-black text-[10px] uppercase hover:bg-gray-300 active:scale-95 transition-all">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-0.5 px-4">
                          <p className="font-black text-gray-800 leading-tight text-sm">{book.title || "No Title"}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 font-bold uppercase tracking-wide">{book.author || "No Author"}</p>
                        </td>
                        <td className="py-0.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-md font-black uppercase w-fit">
                              {book.category}
                            </span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase w-fit ${isDigital ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                              {book.bookType || 'Physical'}
                            </span>
                          </div>
                        </td>
                        <td className="py-0.5 px-4 text-center">
                            <span className="text-sm font-black text-green-600">${book.basePrice || 0}</span>
                        </td>
                        <td className="py-0.5 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-base font-black ${!isDigital && available <= 0 ? 'text-red-600 animate-pulse' : 'text-green-700'}`}>
                              {isDigital ? "∞" : (available < 0 ? 0 : available)}
                            </span>
                            {!isDigital && <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">of {total}</span>}
                          </div>
                        </td>
                        <td className="py-0.5 px-4 text-center">
                          {(!isDigital && available <= 0) ? (
                            <span className="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black shadow-sm">OUT</span>
                          ) : (
                            <span className="bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-green-200">IN</span>
                          )}
                        </td>
                        <td className="py-0.5 px-4 text-right whitespace-nowrap">
                          <button 
                            onClick={() => handleEdit(book)} 
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] hover:bg-blue-700 transition-all uppercase shadow-sm active:scale-95 mr-2"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => openDeleteModal(book._id)} 
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] hover:bg-red-700 transition-all uppercase shadow-sm active:scale-95"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-300 font-black uppercase tracking-widest italic">
                  No Catalog Matches Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border-b-8 border-red-600">
            <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tighter">Confirm Delete</h2>
            <p className="text-gray-500 mb-6 text-sm">Action is permanent. Enter admin credentials to proceed.</p>
            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <input type="email" placeholder="Admin Email" required className="w-full border-2 rounded-xl p-2 font-bold outline-none focus:border-red-600" value={adminAuth.email} onChange={(e) => setAdminAuth({ ...adminAuth, email: e.target.value })} />
              <input type="password" placeholder="Password" required className="w-full border-2 rounded-xl p-2 font-bold outline-none focus:border-red-600" value={adminAuth.password} onChange={(e) => setAdminAuth({ ...adminAuth, password: e.target.value })} />
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={closeDeleteModal} className="flex-1 py-3 font-bold text-gray-400 hover:text-gray-600 uppercase text-xs transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-red-700 active:scale-95 transition-all">Confirm Delete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCatalog;