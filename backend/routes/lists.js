const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Staff = require("../models/Staff");
const ArchivedStudent = require("../models/ArchivedStudent");

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
router.post("/students/bulk", async (req, res) => {
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
    res.status(201).json({ message: "Bulk import successful" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(201).json({ message: "Import completed (Duplicates skipped)" });
    }
    res.status(500).json({ message: "Bulk import failed", error: err.message });
  }
});

// NEW: UPDATE single student name
router.put("/students/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// PROMOTE students
router.post("/students/promote", async (req, res) => {
  const { fromSubCategory, toSubCategory } = req.body;
  try {
    const result = await Student.updateMany(
      { subCategory: fromSubCategory },
      { $set: { subCategory: toSubCategory } }
    );
    res.json({ 
      message: `Successfully promoted ${result.modifiedCount} students from ${fromSubCategory} to ${toSubCategory}.`,
      count: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ message: "Promotion failed", error: err.message });
  }
});

// DELETE single student
router.delete("/students/:id", async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student removed" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// GRADUATION / ARCHIVE
router.post("/students/graduate", async (req, res) => {
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
router.post("/staff/bulk", async (req, res) => {
  const { names } = req.body;
  if (!names || !Array.isArray(names)) {
    return res.status(400).json({ message: "Invalid names list" });
  }
  try {
    const staffDocs = names.map(name => ({ name }));
    await Staff.insertMany(staffDocs, { ordered: false });
    res.status(201).json({ message: "Staff bulk import successful" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(201).json({ message: "Import completed (Duplicates skipped)" });
    }
    res.status(500).json({ message: "Bulk import failed" });
  }
});

// UPDATE single staff member
router.put("/staff/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    res.json(updatedStaff);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// DELETE single staff member
router.delete("/staff/:id", async (req, res) => {
  try {
    await Staff.findByIdAndDelete(req.params.id);
    res.json({ message: "Staff member removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

module.exports = router;