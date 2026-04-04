import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

// ✅ Dynamic API base (safe for Electron + dev)
const API_BASE = "http://127.0.0.1:5000";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Small retry mechanism (handles backend startup delay)
      let res;
      for (let i = 0; i < 3; i++) {
        try {
          res = await axios.post(`${API_BASE}/api/auth/login`, {
            email,
            password,
          });
          break; // success
        } catch (err) {
          if (i === 2) throw err; // final attempt fails
          await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1s
        }
      }

      // ✅ Save token
      localStorage.setItem("token", res.data.token);

      // ✅ Navigate
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
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-green-600 mb-6 text-center">
          Admin Login
        </h2>

        {error && (
          <div className="mb-4 text-red-600 text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-green-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-green-500 outline-none pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-green-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={20} strokeWidth={2} />
                ) : (
                  <Eye size={20} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold px-6 py-2 rounded-lg shadow-md transition duration-200 ${
              loading
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-green-600 text-yellow-300 hover:bg-green-500"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;