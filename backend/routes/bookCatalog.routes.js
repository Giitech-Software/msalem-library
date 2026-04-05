const express = require("express");
const router = express.Router();
const multer = require("multer"); // ✅ Added for PDF handling
const path = require("path");
const BookCatalog = require("../models/BookCatalog");
const Admin = require("../models/Admin");
const Log = require("../models/Log"); 
const auth = require("../middleware/auth"); 

// --- 📂 MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/pdfs/"); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s/g, "_"));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDFs allowed"), false);
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// GET all catalog books
router.get("/", async (req, res) => {
  try {
    const books = await BookCatalog.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch catalog books" });
  }
});

// POST new book (Enhanced for PDF & Enterprise Costing)
router.post("/add", auth, upload.single("pdf"), async (req, res) => {
  try {
    const { title, author, category, totalQuantity, isbn, publishedYear, description, basePrice, bookType } = req.body;
    const cleanTitle = title.trim();

    const existing = await BookCatalog.findOne({ title: cleanTitle });
    if (existing) {
      return res.status(400).json({ message: "Book title already exists." });
    }

    // Prepare book data (Handling String-to-Number conversion for FormData)
    const bookData = {
      title: cleanTitle,
      author,
      category,
      totalQuantity: Number(totalQuantity) || 0,
      isbn,
      publishedYear,
      description,
      basePrice: Number(basePrice) || 0,
      bookType: bookType || (req.file ? "Digital" : "Physical"),
      pdfUrl: req.file ? `/uploads/pdfs/${req.file.filename}` : null
    };

    const book = new BookCatalog(bookData);
    await book.save();

    // ✅ AUDIT LOG
    await Log.create({
      adminEmail: req.admin.email,
      action: "Catalog Entry Created",
      details: `Added ${bookData.bookType} book: "${cleanTitle}" (Cost: ${bookData.basePrice})`
    });

    res.status(201).json(book);
  } catch (err) {
    console.error("Catalog Add Error:", err);
    res.status(500).json({ message: "Failed to add book. Ensure 'uploads/pdfs' folder exists." });
  }
});

// PUT update existing book
router.put("/:id", auth, async (req, res) => {
  try {
    const oldBook = await BookCatalog.findById(req.params.id);
    const updated = await BookCatalog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    await Log.create({
      adminEmail: req.admin.email,
      action: "Catalog Entry Updated",
      details: `Modified details for book: "${oldBook.title}"`
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update book" });
  }
});

// DELETE book (🔐 Enhanced Security)
router.post("/delete/:id", auth, async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: "Invalid admin email" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const bookToDelete = await BookCatalog.findById(req.params.id);
    if (!bookToDelete) return res.status(404).json({ message: "Book not found" });

    await BookCatalog.findByIdAndDelete(req.params.id);

    await Log.create({
      adminEmail: email,
      action: "Catalog Entry Deleted",
      details: `Permanently removed book title: "${bookToDelete.title}"`
    });

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete book", error });
  }
});

// Search for autocomplete
router.get("/search", async (req, res) => {
  try {
    const { title } = req.query;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title query parameter is required" });
    }
    const books = await BookCatalog.find({
      title: { $regex: title.trim(), $options: "i" }
    }).limit(10);
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: "Failed to search books" });
  }
});

module.exports = router;