const mongoose = require("mongoose");

const archivedStudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  subCategory: { type: String }, // e.g., "SHS3"
  graduationDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ArchivedStudent", archivedStudentSchema);