const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Log = require('../models/Log');

const auth = require("../middleware/auth");
const superAdmin = require("../middleware/superAdmin");
const FinancialRecord = require("../models/FinancialRecord");
const router = express.Router();

// ================= REGISTER =================
router.post('/register', auth, superAdmin, async (req, res) => {
  try {
    const { password, role } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Our new standalone model uses .create() to handle hashing and saving
    await Admin.create({
      email,
      password,
      role: role || "admin"
    });

    await Log.create({
      adminEmail: req.admin.email || "Superadmin", 
      action: "Admin Registration",
      details: `Registered new account: ${email} as ${role || "admin"}`
    });

    res.json({ message: 'Admin created' });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (admin.status === "suspended") {
      return res.status(403).json({ message: "Account suspended" });
    }

    // uses the method inside the Admin class instance
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
      await Log.create({
        adminEmail: email,
        action: "Login",
        details: `Admin logged into the system`
      });
    } catch (logErr) {
      console.error("Login audit log failed:", logErr.message);
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ================= ADMIN MANAGEMENT =================

router.get("/users", auth, superAdmin, async (req, res) => {
  try {
    const users = await Admin.find();
    // Use our toPublic() helper to hide passwords
    const publicUsers = users.map(u => u.toPublic());
    res.json(publicUsers);
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
    await user.save(); // Uses the instance save() we wrote

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

// ✅ GET LOGS (Uses our new getLatestLogs helper)
router.get("/logs", auth, superAdmin, async (req, res) => {
  try {
    const logs = await Log.getLatestLogs(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch security logs" });
  }
});

// ✅ GET FINANCIAL RECORDS (Uses our new findSorted helper)
router.get("/financials", auth, superAdmin, async (req, res) => {
  try {
    const records = await FinancialRecord.findSorted({}, { date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch financial records" });
  }
});

module.exports = router;
