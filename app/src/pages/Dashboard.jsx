import React, { useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "✅ Active Books", path: "/active-books" },
    { name: "📖 Borrow Book", path: "/add-book" },
    { name: "➕ Add Book Title", path: "/add-book-title" },
    { name: "👥 Students List", path: "/students" }, // New
    { name: "👔 Staff List", path: "/staff" },       // New
    { name: "🗂️ Archived Books", path: "/archived-books" },
    { name: "📊 Statistics", path: "/statistics" },
    { name: "⏰ Overdue Books", path: "/overdue" },
    { name: "🧾 Book Catalog", path: "/book-catalog" }
  ];

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let timer;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(handleLogout, 5 * 60 * 1000);
    };
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [handleLogout]);

  return (
    <div className="flex h-screen bg-yellow-50">
      <div className="w-64 bg-green-700 text-white flex flex-col p-4 shadow-lg justify-between overflow-y-auto">
        <div>
          <h2 className="text-2xl font-extrabold mb-4 text-center border-b border-green-500 pb-3">📚 Admin Panel</h2>
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-1 rounded-xl text-xl font-semibold transition-all duration-300 ${
                  location.pathname === item.path 
                    ? "bg-yellow-400 text-green-900 shadow-md" 
                    : "hover:bg-green-600 hover:text-yellow-300"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <button onClick={handleLogout} className="mt-4 w-full bg-red-500 text-white py-2 rounded-xl font-bold hover:bg-red-600 transition text-xs">
          🚪 Logout to Home
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-yellow-100 p-6 shadow-sm flex justify-between items-center border-b-2 border-yellow-500">
          <h1 className="text-3xl font-extrabold text-green-800">M'Salem School Library</h1>
          <div className="text-green-900 font-bold bg-yellow-300 px-4 py-1 rounded-full border border-yellow-500 text-sm italic">Session Secure</div>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-10">
          <div className="bg-white p-12 rounded-3xl shadow-xl border-2 border-yellow-100 max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome back! 👋</h2>
            <p className="text-lg text-gray-600 mb-8">System active. Select a task from the sidebar.</p>
            <p className="text-xl text-red-600 font-black animate-pulse uppercase">🧭 Dashboard Ready</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;