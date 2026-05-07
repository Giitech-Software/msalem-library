const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

module.exports = async function (req, res, next) {
  // Extract token from 'Bearer <token>'
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // 1. Verify the JWT signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 2. Database Check (Using our new standalone findById)
    // This ensures that even if a token is valid, a suspended admin is blocked immediately.
   // Ensure we are using the correct ID from the token payload
    const adminId = decoded._id || decoded.id;
    if (!adminId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const admin = await Admin.findById(adminId);
    
    if (!admin) {
      return res.status(403).json({ message: "Admin account not found" });
    }

    if (admin.status === "suspended") {
      return res.status(403).json({ message: "This account has been suspended. Please contact the super admin." });
    }

    // 3. Attach admin info to request for use in routes (like req.admin.email)
    req.admin = admin;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
