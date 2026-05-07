// backend/middleware/superAdmin.js
const Admin = require("../models/Admin");

module.exports = async function (req, res, next) {
  try {
    // 1. Check if req.admin was already populated by the auth middleware
    const adminId = req.admin?._id || req.admin?.id;
    if (!adminId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // 2. Fetch the latest admin data from NeDB
    const admin = await Admin.findById(adminId);

    // 3. Verify existence and role
    // Using lowercase 'superadmin' to match your check logic
    if (!admin || admin.role !== "superadmin") {
      return res.status(403).json({ 
        message: "Access Denied: You do not have the required permissions for this action." 
      });
    }

    // 4. Update req.admin with the full database object
    // This ensures subsequent routes have access to the latest email and status
    req.admin = admin; 
    next();
  } catch (err) {
    console.error("SuperAdmin Middleware Error:", err.message);
    res.status(500).json({ message: "Server error during authorization" });
  }
};
