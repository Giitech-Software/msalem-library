import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import BackButton from "../components/BackButton";

const Statistics = () => {
  const [activeBooks, setActiveBooks] = useState([]);
  const [archivedBooks, setArchivedBooks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const activeRes = await axios.get("http://localhost:5000/api/books/active");
        const archivedRes = await axios.get("http://localhost:5000/api/books/archived");

        setActiveBooks(activeRes.data);
        setArchivedBooks(archivedRes.data);
      } catch (error) {
        console.error("Failed to fetch statistics data", error);
      }
    };

    fetchData();
  }, []);

  const allBooks = [...activeBooks, ...archivedBooks];

  const totalActive = activeBooks.length;
  const totalArchived = archivedBooks.length;
  const totalBooks = totalActive + totalArchived;

  // Helper functions for time-based filtering
  const isThisWeek = (date) => dayjs(date).isAfter(dayjs().startOf('week'));
  const isThisMonth = (date) => dayjs(date).isSame(dayjs(), 'month');
  const isThisYear = (date) => dayjs(date).isSame(dayjs(), 'year');

  const weeklyCount = allBooks.filter(book => isThisWeek(book.borrowedDate)).length;
  const monthlyCount = allBooks.filter(book => isThisMonth(book.borrowedDate)).length;
  const yearlyCount = allBooks.filter(book => isThisYear(book.borrowedDate)).length;

  // Category Filtering Logic
  const getCountByCategory = (category) => {
    return allBooks.filter(book => book.category === category).length;
  };

  const categories = [
    { label: "Preschool", count: getCountByCategory("Preschool"), color: "bg-pink-500" },
    { label: "Lower Primary", count: getCountByCategory("Lower Primary"), color: "bg-blue-500" },
    { label: "Upper Primary", count: getCountByCategory("Upper Primary"), color: "bg-indigo-500" },
    { label: "JHS", count: getCountByCategory("JHS"), color: "bg-purple-500" },
    { label: "SHS", count: getCountByCategory("SHS"), color: "bg-orange-500" },
    { label: "Staff", count: getCountByCategory("Staff"), color: "bg-gray-700" },
  ];

  return (
    <div className="p-8 bg-yellow-50 min-h-screen">
      <BackButton label="⬅ Return to Dashboard" />
      <h1 className="text-3xl font-bold text-center text-green-700 mb-8">📊📘 Library Statistics</h1>

      {/* Main Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-green-700 text-white p-6 rounded-xl shadow-lg text-center">
          <h2 className="text-xl font-bold mb-2">Total Borrowed</h2>
          <p className="text-4xl font-extrabold">{totalBooks}</p>
        </div>
        <div className="bg-yellow-400 text-green-900 p-6 rounded-xl shadow-lg text-center">
          <h2 className="text-xl font-bold mb-2">Books Out</h2>
          <p className="text-4xl font-extrabold">{totalActive}</p>
        </div>
        <div className="bg-white border-2 border-green-600 text-green-700 p-6 rounded-xl shadow-lg text-center">
          <h2 className="text-xl font-bold mb-2">Returned</h2>
          <p className="text-4xl font-extrabold">{totalArchived}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <h2 className="text-2xl font-bold text-green-800 mb-4 border-b-2 border-green-200 pb-2">👥 Borrowers by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {categories.map((cat) => (
          <div key={cat.label} className={`${cat.color} text-white p-4 rounded-xl shadow text-center`}>
            <h3 className="text-sm font-bold uppercase tracking-wider">{cat.label}</h3>
            <p className="text-3xl font-black">{cat.count}</p>
          </div>
        ))}
      </div>

      {/* Time Based Breakdown */}
      <h2 className="text-2xl font-bold text-green-800 mb-4 border-b-2 border-green-200 pb-2">📅 Borrowing Trends</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-500 text-white p-6 rounded-xl shadow text-center">
          <h3 className="text-lg font-bold mb-1">This Week</h3>
          <p className="text-4xl font-extrabold">{weeklyCount}</p>
        </div>
        <div className="bg-yellow-500 text-green-900 p-6 rounded-xl shadow text-center">
          <h3 className="text-lg font-bold mb-1">This Month</h3>
          <p className="text-4xl font-extrabold">{monthlyCount}</p>
        </div>
        <div className="bg-green-300 text-green-900 p-6 rounded-xl shadow text-center">
          <h3 className="text-lg font-bold mb-1">This Year</h3>
          <p className="text-4xl font-extrabold">{yearlyCount}</p>
        </div>
      </div>
    </div>
  );
};

export default Statistics;