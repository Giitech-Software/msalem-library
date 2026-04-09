const mongoose = require("mongoose");

const generalUserSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  borrowerId: { type: String }, // ✅ Added to store GNR-ID
  category: { type: String, default: "General User" },
  subCategory: { type: String }, 
  contact: { type: String }     // ✅ Added to store Phone/Email
});

module.exports = mongoose.model("GeneralUser", generalUserSchema);