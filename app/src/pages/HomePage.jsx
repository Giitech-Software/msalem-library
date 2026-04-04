import React, { useState, useEffect, useMemo } from "react"; 
import { Link } from "react-router-dom";
import logo from "../assets/school_logo.svg"; 
import banner1 from "../assets/library_banner1.png";
import banner2 from "../assets/library_banner2.png";
import banner3 from "../assets/library_banner3.png";

// 1. The original source list
const readingQuotesSource = [
  "🎨 Art is the flower, imagination the bee, but reading is the nectar — Unknown.",
  "🚀 Reading gives us someplace to go when we have to stay where we are — Mason Cooley.",
  "💡 A reader lives a thousand lives before he dies — George R.R. Martin.",
  "🧠 Reading is to the mind what exercise is to the body — Joseph Addison.",
  "🌊 You can't cross the sea merely by standing and staring at the water; you must read the map — Rabindranath Tagore.",
  "🕊️ Once you learn to read, you will be forever free — Frederick Douglass.",
  "🕯️ Reading is a conversation. All books talk. But a good book listens as well — Mark Haddon.",
  "🌟 The more you read, the more you know — Dr. Seuss.",
  "📖 A book is a dream that you hold in your hand — Neil Gaiman.",
  "🧩 Books are the quietest and most constant of friends — Charles W. Eliot.",
  "✨ Today a reader, tomorrow a leader — Margaret Fuller.",
  "📚 Books are a uniquely portable magic — Stephen King.",
  "🏡 A house without books is like a room without windows — Horace Mann.",
  "🎯 A book is a gift you can open again and again — Garrison Keillor.",
  "🤝 There is no friend as loyal as a book — Ernest Hemingway.",
  "🗝️ Reading is a basic tool in the living of a good life — Mortimer J. Adler.",
  "🌌 To read is to fly: it is to soar to a point of vantage which gives a view over wide terrains of history — A.C. Grayling.",
  "🌱 Reading is the nourishment that allows the soul to grow — Unknown.",
  "🔥 Books can be dangerous. The best ones should be labeled 'This could change your life' — Helen Exley.",
  "⛈️ Reading is a discount ticket to everywhere — Mary Schmich."
];

// 2. Shuffle function (Fisher-Yates algorithm for high quality shuffling)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const HomePage = () => {
  // 3. Create a shuffled version of the quotes that persists for this session
  const shuffledQuotes = useMemo(() => shuffleArray(readingQuotesSource), []);
  
  const [quoteIndex, setQuoteIndex] = useState(0);
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % shuffledQuotes.length);
    }, 4000); 
    
    return () => clearInterval(interval);
  }, [shuffledQuotes.length]);

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col border-2 border-yellow-400 font-sans">
      
      {/* --- STATIC HEADER --- */}
      <header className="sticky top-0 z-50 flex justify-between items-center bg-green-700 p-4 shadow-lg border-b-4 border-yellow-400">
        <div className="flex items-center gap-4">
          <img src={logo} alt="School Logo" className="h-10 md:h-14 w-auto rounded-full object-contain" />
          <h1 className="text-base md:text-3xl font-extrabold text-yellow-400 tracking-tight">
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
      <main className="grow flex flex-col">
        
        {/* Banner Section */}
        <div className="w-full flex bg-gray-200 border-b-4 border-yellow-300 overflow-hidden">
          {[banner2, banner1, banner3].map((banner, index) => (
            <div key={index} className="flex-1 relative aspect-16/7 md:aspect-21/9 overflow-hidden">
              <img
                src={banner}
                alt={`Banner ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover object-top hover:scale-105 transition duration-1000 ease-in-out"
              />
            </div>
          ))}
        </div>

        {/* Motivational Quote Section */}
        <div className="grow flex flex-col justify-center items-center text-center p-4 md:p-10">
          <div className="max-w-4xl w-full bg-white/70 p-4 md:p-8 rounded-4xl shadow-2xl border-2 border-blue-400 backdrop-blur-sm transition-all duration-500">
            {/* Quote Text - 'key' helps React track the change for animations */}
            <h2 
              key={quoteIndex}
              className="text-lg md:text-4xl font-bold text-gray-800 mb-8 leading-tight italic min-h-[4em] flex items-center justify-center animate-fadeIn"
            >
              {shuffledQuotes[quoteIndex]}
            </h2>
            
            {/* Call to Action Badge */}
            <div className="inline-block bg-red-200 px-4 py-2 rounded-full border border-red-300">
               <p className="text-[11px] md:text-xs text-red-600 font-black animate-pulse uppercase tracking-[0.3em]">
                  🚀 Build your future by reading today.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* --- STATIC FOOTER --- */}
      <footer className="w-full text-center p-4 bg-green-800 text-white border-t-4 border-yellow-400">
        <p className="text-xs md:text-sm font-medium opacity-90">
          &copy; {new Date().getFullYear()} M'Salem School Library | Knowledge is Power
        </p>
      </footer>

    </div>
  );
};

export default HomePage;