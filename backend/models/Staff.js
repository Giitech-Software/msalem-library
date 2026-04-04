// backend/models/Staff.js
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  department: { type: String }, // Optional extra info
});

module.exports = mongoose.model("Staff", staffSchema);