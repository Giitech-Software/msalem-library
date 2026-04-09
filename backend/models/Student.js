const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  studentId: { type: String },  // ✅ Added to store STD-ID
  category: { type: String },   // ✅ Made optional for safer auto-creation
  subCategory: { type: String },
  contact: { type: String }     // ✅ Added to store Phone/Email
});

module.exports = mongoose.model("Student", studentSchema);