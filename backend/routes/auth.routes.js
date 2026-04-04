const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Log = require('../models/Log'); // ✅ NEW IMPORT

const auth = require("../middleware/auth");
const superAdmin = require("../middleware/superAdmin");

const router = express.Router();

// ================= REGISTER =================
router.post('/register', auth, superAdmin, async (req, res) => {
  const { email, password, role } = req.body;

  const existing = await Admin.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'Admin already exists' });
  }

  const newAdmin = new Admin({
    email,
    password,
    role: role || "admin"
  });

  await newAdmin.save();

  // ✅ LOG ACTION
  await Log.create({
    adminEmail: req.admin.email || "Superadmin", 
    action: "Admin Registration",
    details: `Registered new account: ${email} as ${role || "admin"}`
  });

  res.json({ message: 'Admin created' });
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  if (admin.status === "suspended") {
    return res.status(403).json({ message: "Account suspended" });
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // ✅ LOG LOGIN
  await Log.create({
    adminEmail: email,
    action: "Login",
    details: `Admin logged into the system`
  });

  const token = jwt.sign(
    { id: admin._id, role: admin.role, email: admin.email }, // Added email to token
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token });
});

// ================= ADMIN MANAGEMENT =================

router.get("/users", auth, superAdmin, async (req, res) => {
  try {
    const users = await Admin.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.patch("/users/:id", auth, superAdmin, async (req, res) => {
  try {
    const { status } = req.body; 
    const user = await Admin.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "superadmin") {
      return res.status(400).json({ message: "Cannot modify Superadmin status" });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // ✅ LOG STATUS CHANGE
    await Log.create({
      adminEmail: req.admin.email || "Superadmin",
      action: "Status Update",
      details: `Changed ${user.email} status from ${oldStatus} to ${status}`
    });

    res.json({ message: `Admin status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

router.delete("/users/:id", auth, superAdmin, async (req, res) => {
  try {
    const user = await Admin.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "superadmin") {
      return res.status(400).json({ message: "Cannot delete Superadmin" });
    }

    const deletedEmail = user.email;
    await Admin.findByIdAndDelete(req.params.id);

    // ✅ LOG DELETION
    await Log.create({
      adminEmail: req.admin.email || "Superadmin",
      action: "Admin Deletion",
      details: `Permanently removed admin account: ${deletedEmail}`
    });

    res.json({ message: "Admin permanently removed" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// ✅ NEW: GET LOGS (Super Admin only)
router.get("/logs", auth, superAdmin, async (req, res) => {
  try {
    // Returns last 100 logs, newest first
    const logs = await Log.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch security logs" });
  }
});

module.exports = router;