const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  staffId: { type: String },    // ✅ Added to store STF-ID
  category: { type: String, default: "Staff" }, // ✅ Match form logic
  subCategory: { type: String }, // ✅ Added for Teaching/Non-Teaching
  contact: { type: String },     // ✅ Added to store Phone/Email
  department: { type: String }, 
});

module.exports = mongoose.model("Staff", staffSchema);