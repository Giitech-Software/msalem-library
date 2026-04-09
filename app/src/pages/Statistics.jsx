import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { jwtDecode } from "jwt-decode";
import BackButton from "../components/BackButton";

const Statistics = () => {
  const [activeBooks, setActiveBooks] = useState([]);
  const [archivedBooks, setArchivedBooks] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role);
    }

    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const activeRes = await axios.get("http://localhost:5000/api/books/active");
        const archivedRes = await axios.get("http://localhost:5000/api/books/archived");

        setActiveBooks(activeRes.data);
        setArchivedBooks(archivedRes.data);

        // Fetch financials only for SuperAdmin
        if (token && jwtDecode(token).role === "superadmin") {
          const finRes = await axios.get("http://localhost:5000/api/auth/financials", config);
          const total = finRes.data.reduce((sum, rec) => sum + (rec.amount || 0), 0);
          setTotalRevenue(total);
        }
      } catch (error) {
        console.error("Failed to fetch statistics data", error);
      }
    };

    fetchData();
  }, []);

  const allBooks = [...activeBooks, ...archivedBooks];
  const totalActive = activeBooks.length;
  const totalArchived = archivedBooks.length;
  const totalTransactions = allBooks.length;

  const digitalCount = allBooks.filter(book => book.bookType === "Digital").length;

  // Time-based filtering
  const isThisWeek = (date) => dayjs(date).isAfter(dayjs().startOf('week'));
  const isThisMonth = (date) => dayjs(date).isSame(dayjs(), 'month');
  const isThisYear = (date) => dayjs(date).isSame(dayjs(), 'year');

  const weeklyCount = allBooks.filter(book => isThisWeek(book.borrowedDate)).length;
  const monthlyCount = allBooks.filter(book => isThisMonth(book.borrowedDate)).length;
  const yearlyCount = allBooks.filter(book => isThisYear(book.borrowedDate)).length;

  // Categories accurately matching your BorrowBook logic
  const categories = [
    { label: "Preschool", count: allBooks.filter(b => b.category === "Preschool").length, color: "bg-pink-500" },
    { label: "Lower Primary", count: allBooks.filter(b => b.category === "Lower Primary").length, color: "bg-blue-500" },
    { label: "Upper Primary", count: allBooks.filter(b => b.category === "Upper Primary").length, color: "bg-indigo-500" },
    { label: "JHS", count: allBooks.filter(b => b.category === "JHS").length, color: "bg-purple-500" },
    { label: "SHS", count: allBooks.filter(b => b.category === "SHS").length, color: "bg-orange-500" },
    { label: "Tertiary", count: allBooks.filter(b => b.category === "Tertiary").length, color: "bg-cyan-600" },
    { label: "Staff", count: allBooks.filter(b => b.category === "Staff").length, color: "bg-gray-700" },
    { label: "General", count: allBooks.filter(b => b.category === "General User").length, color: "bg-teal-600" },
  ];

  return (
    <div className="p-8 bg-yellow-50 border-2 border-yellow-200 min-h-screen font-sans">
      <BackButton label="⬅ Return to Dashboard" />
      <h1 className="text-3xl font-black text-center text-green-700 mb-8 uppercase tracking-tight">
        📊 Library System Analytics
      </h1>

      {/* 💰 Financial Vault (SuperAdmin Only) */}
      {userRole === "superadmin" && (
        <div className="mb-10 bg-white border-2 border-green-700 p-2 rounded-2xl shadow-xl flex flex-col items-center justify-center">
          <h2 className="text-green-700 text-xs font-black uppercase tracking-widest mb-1">Total Vault Revenue</h2>
          <p className="text-4xl font-black text-gray-800">GHS {totalRevenue.toFixed(2)}</p>
          <div className="mt-2 h-1 w-24 bg-yellow-400 rounded-full"></div>
        </div>
      )}

      {/* Main Totals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-green-700 text-white p-6 rounded-2xl shadow-lg border-b-4 border-green-900 transition-transform hover:scale-105">
          <h2 className="text-sm font-bold uppercase opacity-80 mb-1">Total Borrowed</h2>
          <p className="text-4xl font-black">{totalTransactions}</p>
        </div>
        <div className="bg-yellow-400 text-green-900 p-6 rounded-2xl shadow-lg border-b-4 border-yellow-600 transition-transform hover:scale-105">
          <h2 className="text-sm font-bold uppercase opacity-80 mb-1">Books Out</h2>
          <p className="text-4xl font-black">{totalActive}</p>
        </div>
        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg border-b-4 border-blue-800 transition-transform hover:scale-105">
          <h2 className="text-sm font-bold uppercase opacity-80 mb-1">Digital Dispatched</h2>
          <p className="text-4xl font-black">{digitalCount}</p>
        </div>
        <div className="bg-white border-2 border-green-600 text-green-700 p-6 rounded-2xl shadow-lg border-b-4 border-gray-200 transition-transform hover:scale-105">
          <h2 className="text-sm font-bold uppercase opacity-60 mb-1 text-gray-500">Total Returned</h2>
          <p className="text-4xl font-black text-gray-800">{totalArchived}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white p-6 rounded-3xl border-2 border-yellow-100 shadow-sm mb-10">
        <h2 className="text-2xl font-black text-green-800 mb-6 flex items-center gap-2">
          👥 Activity by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <div key={cat.label} className="flex flex-col items-center">
              <div className={`${cat.color} w-full text-white p-4 rounded-2xl shadow-md text-center transform transition hover:-translate-y-1`}>
                <h3 className="text-[10px] font-black uppercase leading-tight mb-1">{cat.label}</h3>
                <p className="text-2xl font-black">{cat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Based Breakdown */}
      <h2 className="text-2xl font-black text-green-800 mb-4 border-b-4 border-yellow-400 inline-block pb-1">
        📅 Issuance Trends
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="bg-white border-2 border-green-500 p-6 rounded-2xl shadow-md hover:bg-green-50 transition">
          <h3 className="text-xs font-black text-green-600 uppercase mb-1">This Week</h3>
          <p className="text-4xl font-black text-gray-800">{weeklyCount}</p>
        </div>
        <div className="bg-white border-2 border-yellow-500 p-6 rounded-2xl shadow-md hover:bg-yellow-50 transition">
          <h3 className="text-xs font-black text-yellow-600 uppercase mb-1">This Month</h3>
          <p className="text-4xl font-black text-gray-800">{monthlyCount}</p>
        </div>
        <div className="bg-white border-2 border-blue-400 p-6 rounded-2xl shadow-md hover:bg-blue-50 transition">
          <h3 className="text-xs font-black text-blue-500 uppercase mb-1">This Year</h3>
          <p className="text-4xl font-black text-gray-800">{yearlyCount}</p>
        </div>
      </div>
    </div>
  );
};

export default Statistics;