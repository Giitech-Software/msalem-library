const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  borrowerName: { type: String, required: true },
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

module.exports = mongoose.model("Book", bookSchema);
