//backend/models/FinancialRecord.js
const mongoose = require("mongoose");

const financialRecordSchema = new mongoose.Schema({
  title: { type: String, required: true },
  borrowerName: { type: String, required: true },
  borrowerId: { type: String },
  bookType: { type: String, enum: ["Physical", "Digital"] },
  amount: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  issuedBy: { type: String }, // Tracks which admin collected the money
  // High Security: This helps the Superadmin see if the source record was deleted
  isOrphaned: { type: Boolean, default: false } 
}, { timestamps: true });

module.exports = mongoose.model("FinancialRecord", financialRecordSchema);