//backend/models/Book.js
const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  borrowerName: { type: String, required: true },
  // ✅ NEW: Unique Identifier for Students/Staff
  // This prevents twin/triplet name conflicts
  borrowerId: { type: String, required: true }, 
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  borrowedDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  contact: { type: String },
  returned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexing the borrowerId and returned status makes the "unreturned check" lightning fast
bookSchema.index({ borrowerId: 1, returned: 1 });

module.exports = mongoose.model("Book", bookSchema);