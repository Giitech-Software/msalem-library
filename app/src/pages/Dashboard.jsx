import React, { useEffect, useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // You may need to: npm install jwt-decode

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");

  // Base menu items available to everyone
  const menuItems = [
    { name: "✅ Active Books", path: "/active-books" },
    { name: "📖 Borrow Book", path: "/add-book" },
    { name: "➕ Add Book Title", path: "/add-book-title" },
    { name: "👥 Students List", path: "/students" },
    { name: "👔 Staff List", path: "/staff" },
    { name: "🗂️ Archived Books", path: "/archived-books" },
    { name: "📊 Statistics", path: "/statistics" },
    { name: "⏰ Overdue Books", path: "/overdue" },
    { name: "🧾 Book Catalog", path: "/book-catalog" }
  ];

  // Logic to check role and add Superadmin menu
  const getFullMenu = () => {
    const finalMenu = [...menuItems];
    if (userRole === "superadmin") {
      // Adds the management link at the very top for easy access
      finalMenu.unshift({ name: "🛡️ Admin Management", path: "/admin-management" });
    }
    return finalMenu;
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    // 1. Get User Role from Token on Load
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role); // Assuming your JWT payload has { role: "admin" }
      } catch (error) {
        console.error("Invalid token");
        handleLogout();
      }
    } else {
      handleLogout(); // No token? Kick them out.
    }

    // 2. Idle Auto-Logout Logic
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
      {/* Sidebar */}
      <div className="w-64 bg-green-700 text-white flex flex-col p-4 shadow-lg justify-between overflow-y-auto">
        <div>
          <h2 className="text-2xl font-extrabold mb-4 text-center border-b border-green-00 pb-3 italic">
            📚 Admin Panel
          </h2>
          <nav className="flex flex-col gap-1">
            {getFullMenu().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-1.5 rounded-xl text-lg font-semibold transition-all duration-300 border-l-4 ${
                  location.pathname === item.path 
                    ? "bg-yellow-400 text-green-900 shadow-md border-green-900 translate-x-1" 
                    : "hover:bg-green-600 hover:text-yellow-300 border-transparent"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <div className="text-[10px] text-green-300 text-center mb-2 uppercase tracking-tighter">
            Logged in as: <span className="text-white font-bold">{userRole || "User"}</span>
          </div>
          <button onClick={handleLogout} className="w-full bg-red-500 text-white py-2 rounded-xl font-bold hover:bg-red-600 transition text-xs shadow-inner">
            🚪 Logout to Home
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-yellow-100 p-6 shadow-sm flex justify-between items-center border-b-2 border-yellow-500">
          <h1 className="text-3xl font-extrabold text-green-800">M'Salem School Library</h1>
          <div className="text-green-900 font-bold bg-yellow-300 px-4 py-1 rounded-full border border-yellow-500 text-sm italic">
            Session Secure
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center text-center p-10">
          <div className="bg-white p-12 rounded-3xl shadow-xl border-2 border-yellow-100 max-w-2xl relative overflow-hidden">
             {/* Subtle indicator for Superadmin */}
             {userRole === 'superadmin' && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-3 py-1 font-bold uppercase rounded-bl-lg">
                  Superadmin Access
                </div>
             )}
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome back! 👋</h2>
            <p className="text-lg text-gray-600 mb-8">System active. Select a task from the sidebar.</p>
            <p className="text-xl text-red-600 font-black animate-pulse uppercase tracking-widest">🧭 Dashboard Ready</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;