import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, Clock } from "lucide-react";

const API_BASE = "http://127.0.0.1:5000";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState(""); // New state for info alerts
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Check for session expiry on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("reason") === "expired") {
      setInfoMessage("Your session has timed out for security. Please log in again.");
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage(""); // Clear info when user tries again
    setLoading(true);

    try {
      let res;
      for (let i = 0; i < 3; i++) {
        try {
          res = await axios.post(`${API_BASE}/api/auth/login`, {
            email,
            password,
          });
          break; 
        } catch (err) {
          if (i === 2) throw err;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      localStorage.setItem("token", res.data.token);
      navigate("/dashboard", { replace: true });

    } catch (err) {
      console.error("Login error:", err);
      if (err.response && err.response.status === 403) {
        setError("🚫 This account has been suspended. Please contact the Superadmin.");
      } else if (err.response && err.response.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === "ECONNREFUSED") {
        setError("⚠️ Server is starting... please try again.");
      } else {
        setError("Unable to connect to server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-green-600">
        <h2 className="text-3xl font-black text-green-700 mb-2 text-center uppercase tracking-tight">
          Admin Login
        </h2>
        <p className="text-gray-500 text-center text-xs mb-6 font-bold uppercase tracking-widest">Library Management System</p>

        {/* 🕒 Session Expired Message */}
        {infoMessage && (
          <div className="mb-4 bg-blue-50 border-2 border-blue-200 p-3 rounded-xl flex items-center gap-3 text-blue-700 animate-pulse">
            <Clock size={20} />
            <span className="text-sm font-bold leading-tight">{infoMessage}</span>
          </div>
        )}

        {/* 🚫 Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border-2 border-red-200 p-3 rounded-xl flex items-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <span className="text-sm font-bold leading-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
            <input
              type="email"
              className="border-2 border-gray-100 bg-gray-50 rounded-xl p-2 w-full focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all font-bold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="admin@library.com"
            />
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="border-2 border-gray-100 bg-gray-50 rounded-xl p-2 w-full focus:ring-2 focus:ring-green-500 focus:bg-white outline-none pr-12 transition-all font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-green-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-black px-4 py-3 rounded-xl shadow-lg transition duration-200 uppercase tracking-widest ${
              loading
                ? "bg-gray-300 text-white cursor-not-allowed"
                : "bg-green-700 text-yellow-300 hover:bg-green-600 hover:shadow-green-200"
            }`}
          >
            {loading ? "Verifying..." : "Enter Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;