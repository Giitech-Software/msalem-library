const express = require("express");
const router = express.Router();
const BookCatalog = require("../models/BookCatalog");
const Admin = require("../models/Admin");
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
router.post("/add", async (req, res) => {
  try {
    // Prevent duplicate titles
    const existing = await BookCatalog.findOne({ title: req.body.title.trim() });
    if (existing) {
      return res.status(400).json({ message: "Book title already exists." });
    }
    const book = new BookCatalog({ ...req.body, title: req.body.title.trim() });
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: "Failed to add book" });
  }
});

// PUT update existing book
router.put("/:id", async (req, res) => {
  try {
    const updated = await BookCatalog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update book" });
  }
});

// DELETE book
// 🔐 Secure deletion route
router.post("/delete/:id", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Invalid admin email" });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const deletedBook = await BookCatalog.findByIdAndDelete(req.params.id);

    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Optional audit log
    console.log(`Admin ${email} deleted catalog book ${req.params.id}`);

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
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
