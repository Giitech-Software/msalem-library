// backend/models/Student.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true }, // e.g., "Lower Primary"
  subCategory: { type: String },              // e.g., "Cl1"
});

module.exports = mongoose.model("Student", studentSchema);