// backend/routes/bookCatalog.routes.js
const express = require("express");
const router = express.Router();
const BookCatalog = require("../models/BookCatalog");
const Admin = require("../models/Admin");
const Log = require("../models/Log"); // ✅ Added Log model
const auth = require("../middleware/auth"); // ✅ Added auth middleware

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
router.post("/add", auth, async (req, res) => {
  try {
    const title = req.body.title.trim();
    const existing = await BookCatalog.findOne({ title });
    
    if (existing) {
      return res.status(400).json({ message: "Book title already exists." });
    }

    const book = new BookCatalog({ ...req.body, title });
    await book.save();

    // ✅ AUDIT LOG
    await Log.create({
      adminEmail: req.admin.email,
      action: "Catalog Entry Created",
      details: `Added new book title to catalog: "${title}"`
    });

    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: "Failed to add book" });
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

    // ✅ AUDIT LOG
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

    // ✅ AUDIT LOG
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