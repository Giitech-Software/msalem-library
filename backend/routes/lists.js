const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Staff = require("../models/Staff");
const GeneralUser = require("../models/GeneralUser");
const ArchivedStudent = require("../models/ArchivedStudent");
const Log = require("../models/Log");
const auth = require("../middleware/auth");

function byName(a, b) {
  return (a.name || "").localeCompare(b.name || "");
}

function normalizeName(name) {
  return String(name || "").trim();
}

// --- STUDENT ROUTES ---

// GET all students
router.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    // NeDB find() returns array; manual sort for reliability
    students.sort(byName);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

// BULK INSERT students (Refactored for NeDB)
router.post("/students/bulk", auth, async (req, res) => {
  const { names, category, subCategory } = req.body;
  if (!names || !Array.isArray(names)) {
    return res.status(400).json({ message: "Invalid names list" });
  }

  try {
    let count = 0;
    for (const rawName of names) {
      const name = normalizeName(rawName);
      if (!name) continue;
      // Check for duplicates manually to simulate {ordered: false}
      const existing = await Student.findOne({ name, subCategory });
      if (!existing) {
        await Student.create({ name, category, subCategory });
        count++;
      }
    }

    await Log.create({
      adminEmail: req.admin.email,
      action: "Student Bulk Import",
      details: `Imported ${count} students into ${category} (${subCategory})`
    });

    res.status(201).json({ message: "Bulk import successful", imported: count });
  } catch (err) {
    res.status(500).json({ message: "Bulk import failed", error: err.message });
  }
});

// UPDATE single student
router.put("/students/:id", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const oldName = student.name;
    student.name = name;
    await student.save();

    await Log.create({
      adminEmail: req.admin.email,
      action: "Student Update",
      details: `Renamed "${oldName}" to "${name}"`
    });

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// PROMOTE students (Refactored: No updateMany in NeDB)
router.post("/students/promote", auth, async (req, res) => {
  const { fromSubCategory, toSubCategory } = req.body;
  try {
    const students = await Student.find({ subCategory: fromSubCategory });
    
    for (let student of students) {
      student.subCategory = toSubCategory;
      await student.save();
    }

    await Log.create({
      adminEmail: req.admin.email,
      action: "Class Promotion",
      details: `Promoted ${students.length} students from ${fromSubCategory} to ${toSubCategory}`
    });

    res.json({ 
      message: `Successfully promoted ${students.length} students.`,
      count: students.length 
    });
  } catch (err) {
    res.status(500).json({ message: "Promotion failed", error: err.message });
  }
});

// DELETE single student
router.delete("/students/:id", auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    await Student.findByIdAndDelete(req.params.id);

    await Log.create({
      adminEmail: req.admin.email,
      action: "Student Deletion",
      details: `Permanently removed student: "${student.name}"`
    });

    res.json({ message: "Student removed" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// GRADUATION / ARCHIVE
router.post("/students/graduate", auth, async (req, res) => {
  const { subCategory } = req.body;
  try {
    const graduatingStudents = await Student.find({ subCategory });
    if (graduatingStudents.length === 0) {
      return res.status(404).json({ message: "No students found to graduate." });
    }
    
    for (let s of graduatingStudents) {
      await ArchivedStudent.create({
        name: s.name,
        category: s.category,
        subCategory: s.subCategory,
        graduatedDate: new Date()
      });
      await Student.findByIdAndDelete(s._id);
    }

    await Log.create({
      adminEmail: req.admin.email,
      action: "Class Graduation",
      details: `Graduated and archived ${graduatingStudents.length} students from ${subCategory}`
    });

    res.json({ message: "Graduation successful", count: graduatingStudents.length });
  } catch (err) {
    res.status(500).json({ message: "Graduation failed", error: err.message });
  }
});

// --- STAFF ROUTES ---

router.get("/staff", async (req, res) => {
  try {
    const staff = await Staff.find();
    staff.sort(byName);
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch staff" });
  }
});

router.post("/staff/bulk", auth, async (req, res) => {
  const { names } = req.body;
  if (!names || !Array.isArray(names)) {
    return res.status(400).json({ message: "Invalid names list" });
  }

  try {
    let count = 0;
    for (const rawName of names) {
      const name = normalizeName(rawName);
      if (!name) continue;
      const exists = await Staff.findOne({ name });
      if (!exists) {
        await Staff.create({ name });
        count++;
      }
    }
    await Log.create({ adminEmail: req.admin.email, action: "Staff Bulk Import", details: `Imported ${count} staff.` });
    res.status(201).json({ message: "Staff bulk import successful" });
  } catch (err) { res.status(500).json({ message: "Bulk import failed", error: err.message }); }
});

router.put("/staff/:id", auth, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    const oldName = staff.name;
    staff.name = req.body.name;
    await staff.save();
    await Log.create({ adminEmail: req.admin.email, action: "Staff Update", details: `Renamed ${oldName} to ${req.body.name}` });
    res.json(staff);
  } catch (err) { res.status(500).json({ message: "Update failed", error: err.message }); }
});

router.delete("/staff/:id", auth, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    await Staff.findByIdAndDelete(req.params.id);
    await Log.create({ adminEmail: req.admin.email, action: "Staff Deletion", details: `Removed: ${staff.name}` });
    res.json({ message: "Staff removed" });
  } catch (err) { res.status(500).json({ message: "Delete failed", error: err.message }); }
});

// --- GENERAL USER ROUTES ---

router.get("/general", async (req, res) => {
  try {
    const users = await GeneralUser.find();
    users.sort(byName);
    res.json(users);
  } catch (err) { res.status(500).json({ message: "Failed to fetch general users" }); }
});

router.post("/general/bulk", auth, async (req, res) => {
  const { names, subCategory } = req.body;
  if (!names || !Array.isArray(names)) {
    return res.status(400).json({ message: "Invalid names list" });
  }

  try {
    let count = 0;
    for (const rawName of names) {
      const name = normalizeName(rawName);
      if (!name) continue;
      const exists = await GeneralUser.findOne({ name, subCategory });
      if (!exists) {
        await GeneralUser.create({ name, subCategory });
        count++;
      }
    }
    await Log.create({ adminEmail: req.admin.email, action: "General User Bulk Import", details: `Imported ${count} users.` });
    res.status(201).json({ message: "Import successful" });
  } catch (err) { res.status(500).json({ message: "Bulk import failed", error: err.message }); }
});

router.put("/general/:id", auth, async (req, res) => {
  try {
    const user = await GeneralUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldName = user.name;
    user.name = normalizeName(req.body.name);
    if (req.body.subCategory !== undefined) user.subCategory = req.body.subCategory;
    if (req.body.contact !== undefined) user.contact = req.body.contact;
    await user.save();

    await Log.create({
      adminEmail: req.admin.email,
      action: "General User Update",
      details: `Renamed ${oldName} to ${user.name}`
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

router.delete("/general/:id", auth, async (req, res) => {
  try {
    const user = await GeneralUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await GeneralUser.findByIdAndDelete(req.params.id);
    await Log.create({
      adminEmail: req.admin.email,
      action: "General User Deletion",
      details: `Removed: ${user.name}`
    });

    res.json({ message: "User removed" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

module.exports = router;
