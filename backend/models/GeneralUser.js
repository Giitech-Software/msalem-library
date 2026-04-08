const mongoose = require("mongoose");

const generalUserSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, default: "General User" },
  subCategory: { type: String }, // Community Member, Parent, etc.
});

module.exports = mongoose.model("GeneralUser", generalUserSchema);