import React, { useState, useEffect } from "react"; 
import { Link } from "react-router-dom";
import logo from "../assets/school_logo.svg";
import banner1 from "../assets/library_banner1.png";
import banner2 from "../assets/library_banner2.png";
import banner3 from "../assets/library_banner3.png";

const readingQuotes = [
  "🧠 Reading is to the mind what exercise is to the body — Joseph Addison.",
  "🎯 A book is a gift you can open again and again — Garrison Keillor.",
  "✨ Today a reader, tomorrow a leader — Margaret Fuller",
  "🌟 The more you read, the more you know — Dr. Seuss",
  "💡 A reader lives a thousand lives before he dies — George R.R. Martin.",
  "📚 Books are a uniquely portable magic — Stephen King.",
  "🕊️ Once you learn to read, you will be forever free — Frederick Douglass.",
  "🤝 There is no friend as loyal as a book — Ernest Hemingway.",
  "📖 A book is a dream that you hold in your hand — Neil Gaiman.",
  "🚀 Reading gives us someplace to go when we have to stay where we are — Mason Cooley.",
];

const HomePage = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % readingQuotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    /* Changed h-screen to min-h-screen and removed overflow-hidden */
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      
      {/* --- STATIC HEADER --- */}
      <header className="sticky top-0 z-50 flex justify-between items-center bg-green-700 p-4 shadow-lg border-b-4 border-yellow-400">
        <div className="flex items-center gap-4">
          <img src={logo} alt="School Logo" className="h-12 md:h-16 w-auto rounded-full" />
          <h1 className="text-lg md:text-3xl font-extrabold text-yellow-400 tracking-tight">
            M'Salem School Library
          </h1>
        </div>

        <Link
          to={isLoggedIn ? "/dashboard" : "/login"}
          className="bg-yellow-400 text-green-800 px-4 py-2 rounded-xl text-xs md:text-lg font-bold hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-md whitespace-nowrap"
        >
          {isLoggedIn ? "📊 Dashboard" : "🔑 Admin Login"}
        </Link>
      </header>

      {/* --- CONTENT AREA --- */}
      <main className="flex-grow flex flex-col">
        
        {/* Banner Section - Using aspect-ratio for consistency */}
        <div className="w-full flex overflow-hidden border-b-4 border-yellow-300 bg-gray-200">
          {[banner2, banner1, banner3].map((banner, index) => (
            <div key={index} className="flex-1 overflow-hidden">
              <img
                src={banner}
                alt={`Banner ${index + 1}`}
                /* Using object-cover and a defined height that scales well */
                className="h-32 md:h-56 w-full object-cover transform hover:scale-110 transition duration-700"
              />
            </div>
          ))}
        </div>

        {/* Motivational Quote Section */}
        <div className="flex-grow flex flex-col justify-center items-center text-center p-6 md:p-12">
          <div className="max-w-4xl w-full bg-white/60 p-8 md:p-12 rounded-3xl shadow-xl border border-yellow-200">
            <h2 className="text-xl md:text-4xl font-bold text-gray-800 mb-8 leading-relaxed italic">
              {readingQuotes[quoteIndex]}
            </h2>
            <div className="inline-block bg-red-100 px-4 py-2 rounded-full">
               <p className="text-xs md:text-sm text-red-600 font-black animate-pulse uppercase tracking-[0.2em]">
                🚀 Build your future by reading today.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* --- STATIC FOOTER --- */}
      <footer className="w-full text-center p-4 bg-green-800 text-white border-t-4 border-yellow-400">
        <p className="text-xs md:text-base font-semibold">
          &copy; {new Date().getFullYear()} M'Salem School Library • <span className="text-yellow-400 text-nowrap">Developer • Solomon K. Aggrey</span>
        </p>
      </footer>

    </div>
  );
};

export default HomePage;