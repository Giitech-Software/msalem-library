const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin"); // Import the model

module.exports = async function (req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ CRITICAL: Check if the admin is suspended in the database
    const admin = await Admin.findById(decoded.id);
    if (!admin || admin.status === "suspended") {
      return res.status(403).json({ message: "Account suspended or not found" });
    }

    req.admin = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};