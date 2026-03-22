const Admin = require("../models/Admin");

module.exports = async function (req, res, next) {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin || admin.role !== "superadmin") {
      return res.status(403).json({ message: "Access Denied: Superadmin only" });
    }

    req.adminData = admin;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error during authorization" });
  }
};