const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const BookCatalog = require("../models/BookCatalog");
const Admin = require("../models/Admin");
const Log = require("../models/Log"); 
const auth = require("../middleware/auth"); 

// --- 📂 MULTER CONFIGURATION (Standalone Friendly) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the path is relative to your data directory
    const uploadDir = path.join(process.env.DATA_DIR, "uploads", "pdfs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir); 
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

// POST new book
router.post("/add", auth, upload.single("pdf"), async (req, res) => {
  try {
    const { title, author, category, totalQuantity, isbn, publishedYear, description, basePrice, bookType } = req.body;
    const cleanTitle = title.trim();

    const existing = await BookCatalog.findOne({ title: cleanTitle });
    if (existing) {
      return res.status(400).json({ message: "Book title already exists." });
    }

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

    const book = await BookCatalog.create(bookData);

    await Log.create({
      adminEmail: req.admin.email,
      action: "Catalog Entry Created",
      details: `Added ${bookData.bookType} book: "${cleanTitle}"`
    });

    res.status(201).json(book);
  } catch (err) {
    console.error("Catalog Add Error:", err);
    res.status(500).json({ message: "Failed to add book. Database or File system error." });
  }
});

// PUT update existing book
router.put("/:id", auth, async (req, res) => {
  try {
    const book = await BookCatalog.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // Update object properties manually for NeDB instance
    Object.assign(book, req.body);
    
    // Ensure numeric fields are numbers
    if (req.body.totalQuantity) book.totalQuantity = Number(req.body.totalQuantity);
    if (req.body.basePrice) book.basePrice = Number(req.body.basePrice);

    await book.save();

    await Log.create({
      adminEmail: req.admin.email,
      action: "Catalog Entry Updated",
      details: `Modified details for book: "${book.title}"`
    });

    res.json(book);
  } catch (err) {
    res.status(500).json({ message: "Failed to update book" });
  }
});

// DELETE book
router.post("/delete/:id", auth, async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const bookToDelete = await BookCatalog.findById(req.params.id);
    if (!bookToDelete) return res.status(404).json({ message: "Book not found" });

    // Optional: Delete the physical PDF file if it exists
    if (bookToDelete.pdfUrl) {
      const fileName = path.basename(bookToDelete.pdfUrl);
      const filePath = path.join(process.env.DATA_DIR, "uploads", "pdfs", fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await BookCatalog.findByIdAndDelete(req.params.id);

    await Log.create({
      adminEmail: email,
      action: "Catalog Entry Deleted",
      details: `Permanently removed book title: "${bookToDelete.title}"`
    });

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete book" });
  }
});

// Search for autocomplete (NeDB compatible Regex)
router.get("/search", async (req, res) => {
  try {
    const { title } = req.query;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title query parameter is required" });
    }
    
    // NeDB accepts standard JS RegExp objects
    const searchRegex = new RegExp(title.trim(), "i");
    
    const books = await BookCatalog.find({ title: searchRegex });
    
    // Manual limit since NeDB-promises find() returns the full array
    res.json(books.slice(0, 10));
  } catch (err) {
    res.status(500).json({ message: "Failed to search books" });
  }
});

module.exports = router;
