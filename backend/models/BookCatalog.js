// backend/models/BookCatalog.js
const mongoose = require("mongoose");

const bookCatalogSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, "Book title is required"], 
    trim: true 
  },
  author: { 
    type: String, 
    trim: true 
  },
  category: { 
    type: String, 
    // Expanded list to match common school library needs
    enum: {
      values: ["Textbook", "Storybook", "Reference", "Novel", "Periodical", "General"],
      message: '{VALUE} is not a supported category'
    },
    required: [true, "Category is required"],
    default: "General"
  },
  // NEW COLUMN: Total books brought to the library
  totalQuantity: {
    type: Number,
    required: [true, "Total quantity is required"],
    min: [0, "Quantity cannot be negative"],
    default: 1
  },
  isbn: { 
    type: String, 
    trim: true 
  },
  publishedYear: { 
    type: String, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
}, { timestamps: true });

// Indexing title for faster searching in your "Borrow Book" form
bookCatalogSchema.index({ title: 'text' });

module.exports = mongoose.model("BookCatalog", bookCatalogSchema);