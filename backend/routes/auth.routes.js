// existing imports
const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const auth = require("../middleware/auth");
const superAdmin = require("../middleware/superAdmin");

const router = express.Router();


// ================= REGISTER =================
router.post('/register', async (req, res) => {
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

  const token = jwt.sign(
  { id: admin._id, role: admin.role }, // Add 'role' here!
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

  res.json({ token });
});


// ================= STEP 7 STARTS HERE =================

// CREATE ADMIN (Super Admin only)
// 1. GET ALL USERS (New - Needed for the Management Table)
router.get("/users", auth, superAdmin, async (req, res) => {
  try {
    // Fetch all admins but do not send their hashed passwords to the frontend
    const users = await Admin.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// 2. TOGGLE STATUS (Replaces your old Suspend route)
// This handles both "active" -> "suspended" and "suspended" -> "active"
router.patch("/users/:id", auth, superAdmin, async (req, res) => {
  try {
    const { status } = req.body; // Expecting { "status": "suspended" } or "active"
    const user = await Admin.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Safety: Prevent suspending the superadmin (yourself)
    if (user.role === "superadmin") {
      return res.status(400).json({ message: "Cannot modify Superadmin status" });
    }

    user.status = status;
    await user.save();
    res.json({ message: `Admin status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 3. DELETE ADMIN (Improved with Safety Check)
router.delete("/users/:id", auth, superAdmin, async (req, res) => {
  try {
    const user = await Admin.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Safety: Prevent deleting the superadmin
    if (user.role === "superadmin") {
      return res.status(400).json({ message: "Cannot delete Superadmin" });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: "Admin permanently removed" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});


// ================= END =================
module.exports = router;