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
    { id: admin._id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token });
});


// ================= STEP 7 STARTS HERE =================

// CREATE ADMIN (Super Admin only)
router.post("/create-admin", auth, superAdmin, async (req, res) => {
  const { email, password } = req.body;

  const existing = await Admin.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  const admin = new Admin({
    email,
    password,
    role: "admin"
  });

  await admin.save();

  res.json({ message: "Admin created" });
});


// SUSPEND ADMIN
router.put("/suspend-admin/:id", auth, superAdmin, async (req, res) => {
  await Admin.findByIdAndUpdate(req.params.id, {
    status: "suspended"
  });

  res.json({ message: "Admin suspended" });
});


// DELETE ADMIN
router.delete("/delete-admin/:id", auth, superAdmin, async (req, res) => {
  await Admin.findByIdAndDelete(req.params.id);

  res.json({ message: "Admin deleted" });
});


// ================= END =================
module.exports = router;