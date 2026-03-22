import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // Import icons

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

 // ... existing imports
const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password,
    });
    
    // Save the token (which now contains the 'role' for the Dashboard)
    localStorage.setItem("token", res.data.token);
    
    // Navigate to dashboard
    navigate("/dashboard", { replace: true }); 
    
  } catch (err) {
    // Check if the error is specifically about suspension (403)
    if (err.response && err.response.status === 403) {
      setError("🚫 This account has been suspended. Please contact the Superadmin.");
    } else if (err.response && err.response.data.message) {
      // Show backend error message if available (e.g., "Invalid credentials")
      setError(err.response.data.message);
    } else {
      setError("Unable to connect to server. Please try again.");
    }
  }
};
// ... rest of component
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
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative"> {/* Container for positioning */}
              <input
                type={showPassword ? "text" : "password"}
                className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-green-500 outline-none pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-green-600 transition-colors"
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
            className="w-full bg-green-600 text-yellow-300 font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-green-500 transition duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
