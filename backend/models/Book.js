const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  // --- EXISTING CORE FIELDS (Kept 100% Intact) ---
  title: { type: String, required: true },
  borrowerName: { type: String, required: true },
  borrowerId: { type: String, required: true }, 
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  borrowedDate: { type: Date, required: true },
  returnDate: { type: Date, required: false },
  contact: { type: String },
  returned: {
    type: Boolean,
    default: false
  },

  // --- 🚀 ENTERPRISE & DIGITAL UPDATES ---

  // Distinguishes between a physical hand-off and a digital dispatch
  bookType: { 
    type: String, 
    enum: ["Physical", "Digital"], 
    default: "Physical" 
  },

  // Stores the path to the PDF on the server (Only for Digital)
  pdfUrl: { 
    type: String, 
    default: null 
  },

  // Enterprise Financial Tracking: Optional cost per transaction
  borrowingCost: { 
    type: Number, 
    default: 0 
  },

  // Status of the digital dispatch (Sent via WhatsApp/Email)
  dispatchStatus: { 
    type: String, 
    enum: ["Pending", "Sent", "Failed", "N/A"], 
    default: "N/A" 
  }

}, { timestamps: true });

// Existing Index for fast unreturned checks
bookSchema.index({ borrowerId: 1, returned: 1 });

// ✅ NEW: Index for bookType to filter Digital vs Physical reports quickly
bookSchema.index({ bookType: 1 });

module.exports = mongoose.model("Book", bookSchema);