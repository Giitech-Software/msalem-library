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
    enum: {
      values: ["Textbook", "Storybook", "Reference", "Novel", "Periodical", "General"],
      message: '{VALUE} is not a supported category'
    },
    required: [true, "Category is required"],
    default: "General"
  },
  totalQuantity: {
    type: Number,
    required: [true, "Total quantity is required"],
    min: [0, "Quantity cannot be negative"],
    default: 1
  },
  
  // 🚀 NEW FIELDS FOR DIGITAL & ENTERPRISE UPGRADE
  bookType: {
    type: String,
    enum: ["Physical", "Digital"],
    default: "Physical"
  },
  pdfUrl: {
    type: String, // Stores the path to the file: /uploads/pdfs/filename.pdf
    default: null
  },
  basePrice: {
    type: Number, // Stores the borrowing cost for Enterprise tracking
    default: 0
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

bookCatalogSchema.index({ title: 'text' });

module.exports = mongoose.model("BookCatalog", bookCatalogSchema);