//backend/routes/lists.js
const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Staff = require("../models/Staff");
const GeneralUser = require("../models/GeneralUser");
const ArchivedStudent = require("../models/ArchivedStudent");
const Log = require("../models/Log");
const auth = require("../middleware/auth");

// --- STUDENT ROUTES ---

// GET all students (Ordered Alphabetically)
router.get("/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

// BULK INSERT students
router.post("/students/bulk", auth, async (req, res) => {
  const { names, category, subCategory } = req.body;

  if (!names || !Array.isArray(names)) {
    return res.status(400).json({ message: "Invalid names list" });
  }

  try {
    const studentDocs = names.map(name => ({
      name,
      category,
      subCategory
    }));

    await Student.insertMany(studentDocs, { ordered: false });

    // ✅ AUDIT LOG
    await Log.create({
      adminEmail: req.admin.email,
      action: "Student Bulk Import",
      details: `Imported ${names.length} students into ${category} (${subCategory})`
    });

    res.status(201).json({ message: "Bulk import successful" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(201).json({ message: "Import completed (Duplicates skipped)" });
    }
    res.status(500).json({ message: "Bulk import failed", error: err.message });
  }
});

// UPDATE single student name
router.put("/students/:id", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const oldStudent = await Student.findById(req.params.id);
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );

    // ✅ AUDIT LOG
    await Log.create({
      adminEmail: req.admin.email,
      action: "Student Update",
      details: `Renamed "${oldStudent.name}" to "${name}"`
    });

    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// PROMOTE students
router.post("/students/promote", auth, async (req, res) => {
  const { fromSubCategory, toSubCategory } = req.body;
  try {
    const result = await Student.updateMany(
      { subCategory: fromSubCategory },
      { $set: { subCategory: toSubCategory } }
    );

    // ✅ AUDIT LOG
    await Log.create({
      adminEmail: req.admin.email,
      action: "Class Promotion",
      details: `Promoted ${result.modifiedCount} students from ${fromSubCategory} to ${toSubCategory}`
    });

    res.json({ 
      message: `Successfully promoted ${result.modifiedCount} students from ${fromSubCategory} to ${toSubCategory}.`,
      count: result.modifiedCount 
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

    // ✅ AUDIT LOG
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
      return res.status(404).json({ message: "No students found in this class to graduate." });
    }
    const archiveData = graduatingStudents.map(s => ({
      name: s.name,
      category: s.category,
      subCategory: s.subCategory
    }));
    
    await ArchivedStudent.insertMany(archiveData);
    const result = await Student.deleteMany({ subCategory });

    // ✅ AUDIT LOG
    await Log.create({
      adminEmail: req.admin.email,
      action: "Class Graduation",
      details: `Graduated and archived ${result.deletedCount} students from class ${subCategory}`
    });

    res.json({ 
      message: `Successfully graduated ${result.deletedCount} students from ${subCategory}.`,
      count: result.deletedCount 
    });
  } catch (err) {
    res.status(500).json({ message: "Graduation process failed", error: err.message });
  }
});

// --- STAFF ROUTES ---

// GET all staff
router.get("/staff", async (req, res) => {
  try {
    const staff = await Staff.find().sort({ name: 1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch staff" });
  }
});

// BULK INSERT staff
router.post("/staff/bulk", auth, async (req, res) => {
  const { names } = req.body;
  if (!names || !Array.isArray(names)) {
    return res.status(400).json({ message: "Invalid names list" });
  }
  try {
    const staffDocs = names.map(name => ({ name }));
    await Staff.insertMany(staffDocs, { ordered: false });

    // ✅ AUDIT LOG
    await Log.create({
      adminEmail: req.admin.email,
      action: "Staff Bulk Import",
      details: `Imported ${names.length} staff members into the system.`
    });

    res.status(201).json({ message: "Staff bulk import successful" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(201).json({ message: "Import completed (Duplicates skipped)" });
    }
    res.status(500).json({ message: "Bulk import failed" });
  }
});

// UPDATE single staff member
router.put("/staff/:id", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const oldStaff = await Staff.findById(req.params.id);
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );

    // ✅ AUDIT LOG
    await Log.create({
      adminEmail: req.admin.email,
      action: "Staff Update",
      details: `Updated staff member name from "${oldStaff.name}" to "${name}"`
    });

    res.json(updatedStaff);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// DELETE single staff member
router.delete("/staff/:id", auth, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });

    await Staff.findByIdAndDelete(req.params.id);

    // ✅ AUDIT LOG
    await Log.create({
      adminEmail: req.admin.email,
      action: "Staff Deletion",
      details: `Removed staff member: "${staff.name}"`
    });

    res.json({ message: "Staff member removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

// --- GENERAL USER ROUTES ---

// GET all general users
router.get("/general", async (req, res) => {
  try {
    const users = await GeneralUser.find().sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch general users" });
  }
});

// BULK INSERT general users
router.post("/general/bulk", auth, async (req, res) => {
  const { names, subCategory } = req.body;
  if (!names || !Array.isArray(names)) return res.status(400).json({ message: "Invalid names list" });

  try {
    const userDocs = names.map(name => ({ name, subCategory }));
    await GeneralUser.insertMany(userDocs, { ordered: false });

    await Log.create({
      adminEmail: req.admin.email,
      action: "General User Bulk Import",
      details: `Imported ${names.length} general users into ${subCategory}`
    });

    res.status(201).json({ message: "Import successful" });
  } catch (err) {
    if (err.code === 11000) return res.status(201).json({ message: "Import completed (Duplicates skipped)" });
    res.status(500).json({ message: "Bulk import failed" });
  }
});

// UPDATE general user
router.put("/general/:id", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const updated = await GeneralUser.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// DELETE general user
router.delete("/general/:id", auth, async (req, res) => {
  try {
    await GeneralUser.findByIdAndDelete(req.params.id);
    res.json({ message: "User removed" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});
module.exports = router;