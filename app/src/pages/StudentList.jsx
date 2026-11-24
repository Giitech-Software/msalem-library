import React, { useState, useEffect } from "react";
// ✅ CHANGED: Using centralized API instance
import API from "../api/axiosInstance";
import BackButton from "../components/BackButton";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [selectedArchivedIds, setSelectedArchivedIds] = useState([]);
  const [view, setView] = useState("list"); 
  const [status, setStatus] = useState({ show: false, message: "", type: "" });
  const [searchTerm, setSearchTerm] = useState(""); 
  const [classFilter, setClassFilter] = useState("");

  const [form, setForm] = useState({ name: "", category: "", subCategory: "" });
  const [bulkData, setBulkData] = useState("");
  const [promo, setPromo] = useState({ from: "", to: "" });
  const [gradClass, setGradClass] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const [modal, setModal] = useState({ open: false, type: null, id: null, title: "", message: "", color: "bg-red-600" });

  const categories = {
    Preschool: ["Nursery", "Kg1", "Kg2"],
    "Lower Primary": ["B1", "B2", "B3"],
    "Upper Primary": ["B4", "B5", "B6"],
    JHS: ["JHS1", "JHS2", "JHS3"],
    SHS: ["SHS1", "SHS2", "SHS3"],
    // ✅ ADDED: Tertiary category and levels
    Tertiary: ["Level 100", "Level 200", "Level 300", "Level 400", "Graduate"]
  };

  const allSubCategories = Object.values(categories).flat();

  // ✅ REMOVED: getAuthHeaders (API instance now handles this automatically)

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      // ✅ UPDATED: Using API instance
      const res = await API.get("/students");
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchArchivedStudents = async () => {
    setArchiveLoading(true);
    try {
      const res = await API.get("/students/archived");
      setArchivedStudents(res.data);
      setSelectedArchivedIds([]);
    } catch (err) {
      showStatus(err.response?.data?.message || "Failed to fetch archived students.", "error");
    } finally {
      setArchiveLoading(false);
    }
  };

  const changeView = (nextView) => {
    setView(nextView);
    if (nextView === "archive") fetchArchivedStudents();
  };

  const filteredStudents = students.filter(std => {
    const matchesClass = !classFilter || std.subCategory === classFilter;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      std.name.toLowerCase().includes(search) ||
      std.subCategory.toLowerCase().includes(search) ||
      (std.studentId && std.studentId.toLowerCase().includes(search));

    return matchesClass && matchesSearch;
  });

  const filteredArchivedStudents = archivedStudents.filter((student) =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.subCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBulkImport = async (e) => {
    e.preventDefault();
    const nameArray = bulkData.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
    try {
      // ✅ UPDATED: Using API instance
      await API.post("/students/bulk", {
        names: nameArray,
        category: form.category,
        subCategory: form.subCategory
      });
      
      showStatus(`Successfully imported ${nameArray.length} students!`, "success");
      setBulkData("");
      setView("list");
      fetchStudents();
    } catch { showStatus("Import failed. Check your login.", "error"); }
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
      message: `Move all ${gradClass} students to Archive? You can restore them later from the Archive tab.`,
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

  const triggerRestore = (ids) => {
    if (!ids.length) return;
    setModal({
      open: true,
      type: "restore",
      ids,
      title: ids.length === 1 ? "Restore Student" : "Restore Students",
      message: `Restore ${ids.length} archived student${ids.length === 1 ? "" : "s"} to the student registry?`,
      color: "bg-green-700"
    });
  };

  const handleConfirmAction = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      if (modal.type === 'promote') {
        // ✅ UPDATED: Using API instance
        const res = await API.post("/students/promote", {
          fromSubCategory: promo.from,
          toSubCategory: promo.to
        });
        showStatus(res.data.message, "success");
      } else if (modal.type === 'graduate') {
        // ✅ UPDATED: Using API instance
        const res = await API.post("/students/graduate", {
          subCategory: gradClass
        });
        showStatus(res.data.message, "success");
      } else if (modal.type === 'delete') {
        // ✅ UPDATED: Using API instance
        await API.delete(`/students/${modal.id}`);
        showStatus("Student removed", "success");
      } else if (modal.type === "restore") {
        const res = await API.post("/students/archived/restore", { ids: modal.ids });
        const restoredIds = res.data.restoredIds || [];
        setArchivedStudents((current) => current.filter((student) => !restoredIds.includes(student._id)));
        setSelectedArchivedIds((current) => current.filter((id) => !restoredIds.includes(id)));
        fetchStudents();
        showStatus(
          res.data.skipped?.length
            ? `${res.data.message} ${res.data.skipped.map((student) => student.reason).join(" ")}`
            : res.data.message,
          res.data.skipped?.length ? "error" : "success"
        );
      }
      if (modal.type !== "restore") fetchStudents();
      closeModal();
    } catch (err) {
      showStatus(err.response?.data?.message || "Graduation failed. Please try again.", "error");
      closeModal();
    } finally {
      setActionInProgress(false);
    }
  };

  const startEdit = (std) => {
    setEditingId(std._id);
    setEditName(std.name);
  };

  const handleUpdateStudent = async (id) => {
    try {
      // ✅ UPDATED: Using API instance
      await API.put(`/students/${id}`, { name: editName });
      showStatus("Student updated", "success");
      setEditingId(null);
      fetchStudents();
    } catch { showStatus("Update failed.", "error"); }
  };

  const showStatus = (msg, type) => {
    setStatus({ show: true, message: msg, type });
    setTimeout(() => setStatus({ show: false }), 4000);
  };

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
            <button onClick={() => changeView("list")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'list' ? 'bg-green-700 text-white' : 'text-green-700 hover:bg-green-50'}`}>View All</button>
            <button onClick={() => changeView("bulk")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'bulk' ? 'bg-yellow-500 text-white' : 'text-yellow-600 hover:bg-yellow-50'}`}>Bulk Import</button>
            <button onClick={() => changeView("promote")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'promote' ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}>Promote</button>
            <button onClick={() => changeView("graduate")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'graduate' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'}`}>Graduate</button>
            <button onClick={() => changeView("archive")} className={`px-4 py-2 rounded-xl font-bold transition ${view === 'archive' ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Archive</button>
          </div>
        </div>

        {(view === "list" || view === "archive") && (
          <div className="mb-6 flex flex-col md:flex-row gap-3">
            <input 
              type="text"
              placeholder="🔍 Search by name, ID, or class..."
              className="flex-1 p-2 rounded-2xl border-2 border-yellow-200 shadow-sm outline-none focus:border-green-600 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {view === "list" && (
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                aria-label="Filter students by class"
                className="md:w-56 p-2 rounded-2xl border-2 border-green-200 bg-white shadow-sm outline-none focus:border-green-600 transition font-bold text-green-800"
              >
                <option value="">All classes</option>
                {allSubCategories.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            )}
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
            <p className="text-sm text-gray-500 mb-6 font-medium uppercase tracking-wider">Students can be restored individually or as a group from the Archive tab.</p>
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
                <div className="flex justify-between items-start mb-3">
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
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-800">{std.name}</p>
                          {std.studentId && (
                            <span className="bg-green-100 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-green-200 uppercase">
                              {std.studentId}
                            </span>
                          )}

                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{std.category} • {std.subCategory}</p>
                        {std.contact && (
                          <p className="text-[10px] text-gray-500 italic mt-1 truncate">📞 {std.contact}</p>
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-xl bg-green-50 p-1.5 rounded-full ml-2">🎓</span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-50 mt-auto">
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

        {view === "archive" && (
          <section className="bg-white rounded-3xl shadow-xl border-t-8 border-gray-700 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-800">Graduated Student Archive</h2>
                <p className="text-sm text-gray-500">{filteredArchivedStudents.length} archived student{filteredArchivedStudents.length === 1 ? "" : "s"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
                  <input
                    type="checkbox"
                    checked={filteredArchivedStudents.length > 0 && filteredArchivedStudents.every((student) => selectedArchivedIds.includes(student._id))}
                    onChange={(event) => {
                      const visibleIds = filteredArchivedStudents.map((student) => student._id);
                      setSelectedArchivedIds((current) => event.target.checked
                        ? [...new Set([...current, ...visibleIds])]
                        : current.filter((id) => !visibleIds.includes(id)));
                    }}
                  />
                  Select filtered
                </label>
                <button
                  onClick={() => triggerRestore(selectedArchivedIds)}
                  disabled={selectedArchivedIds.length === 0 || archiveLoading}
                  className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  Restore selected ({selectedArchivedIds.length})
                </button>
              </div>
            </div>

            {archiveLoading ? (
              <p className="py-10 text-center text-gray-500 font-bold">Loading archived students...</p>
            ) : filteredArchivedStudents.length === 0 ? (
              <p className="py-10 text-center text-gray-400 font-bold">
                {archivedStudents.length ? "No archived students match your search." : "No graduated students in the archive."}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArchivedStudents.map((student) => (
                  <article key={student._id} className="border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      aria-label={`Select ${student.name}`}
                      checked={selectedArchivedIds.includes(student._id)}
                      onChange={(event) => setSelectedArchivedIds((current) => event.target.checked
                        ? [...current, student._id]
                        : current.filter((id) => id !== student._id))}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800">{student.name}</h3>
                      <p className="text-xs font-bold text-gray-500 uppercase">{student.category} • {student.subCategory}</p>
                      {student.studentId && <p className="text-xs text-green-700 mt-1">{student.studentId}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Graduated: {new Date(student.graduationDate).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => triggerRestore([student._id])}
                        disabled={archiveLoading}
                        className="mt-3 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 disabled:opacity-50"
                      >
                        Restore student
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{modal.title}</h2>
            <p className="text-gray-500 text-sm mb-6">{modal.message}</p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold">Cancel</button>
              <button onClick={handleConfirmAction} disabled={actionInProgress} className={`flex-1 py-2 text-white rounded-xl font-bold transition ${modal.color} disabled:opacity-50 disabled:cursor-not-allowed`}>
                {actionInProgress ? "Working..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
