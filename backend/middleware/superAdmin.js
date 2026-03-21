const Admin = require("../models/Admin");

module.exports = async function (req, res, next) {

  const admin = await Admin.findById(req.admin.id);

  if (!admin || admin.role !== "superadmin") {
    return res.status(403).json({ message: "Super Admin only" });
  }

  req.adminData = admin;
  next();
};