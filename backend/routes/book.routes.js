//backend/routes/book.routes.js
const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Admin = require("../models/Admin");
const PDFDocument = require("pdfkit");
// Add borrowed book
router.post("/borrow", async (req, res) => {
  try {
    // Check if borrower has an unreturned book
    const existing = await Book.findOne({
      borrowerName: req.body.borrowerName,
      returned: false,
    });
    if (existing) {
      return res.status(400).json({ message: "This borrower must return their previous book before borrowing another." });
    }

    const book = new Book(req.body);
    await book.save();
    res.status(201).json({ message: "Book borrowed successfully", book });
  } catch (error) {
    res.status(500).json({ message: "Failed to borrow book", error });
  }
});

// Get active borrowed books
router.get("/active", async (req, res) => {
  try {
    const books = await Book.find({ returned: false });
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch active books", error });
  }
});
// Export Active Books PDF
// backend/routes/book.routes.js

router.get("/reports/active-books/pdf", async (req, res) => {
  try {
    const books = await Book.find({ returned: false });
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=active-books.pdf");
    doc.pipe(res);

    // Header
    doc.fillColor("#15803d").fontSize(20).text("M'SALEM SCHOOL LIBRARY", { align: "center" });
    doc.fillColor("#4b5563").fontSize(12).text("Detailed Active Borrowed Books Report", { align: "center" });
    doc.moveDown(1);

    // Column X-Coordinates (Adjusted for 5 columns)
    const colTitle = 30;
    const colBorrower = 160;
    const colCategory = 290; // NEW COLUMN
    const colOutDate = 410;
    const colDueDate = 490;

    const tableTop = 120;

    // Table Header Row
    doc.rect(30, tableTop - 5, 535, 20).fill("#16a34a");
    doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
    doc.text("TITLE", colTitle, tableTop);
    doc.text("BORROWER", colBorrower, tableTop);
    doc.text("CATEGORY/CLASS", colCategory, tableTop);
    doc.text("OUT", colOutDate, tableTop);
    doc.text("DUE", colDueDate, tableTop);

    let y = tableTop + 20;
    doc.font("Helvetica").fontSize(8);

    books.forEach((book, index) => {
      // Zebra Stripe
      if (index % 2 === 0) {
        doc.rect(30, y - 5, 535, 25).fill("#f3f4f6");
      }

      doc.fillColor("#000000");
      
      // Data with substring limits to prevent overlapping
      doc.text(book.title.substring(0, 28), colTitle, y);
      doc.text(book.borrowerName.substring(0, 25), colBorrower, y);
      
      // Combine Category and SubCategory for the new column
      const classInfo = `${book.category}${book.subCategory ? ' / ' + book.subCategory : ''}`;
      doc.text(classInfo.substring(0, 24), colCategory, y);
      
      doc.text(new Date(book.borrowedDate).toLocaleDateString(), colOutDate, y);
      doc.text(new Date(book.returnDate).toLocaleDateString(), colDueDate, y);

      // Row separator line
      doc.strokeColor("#e5e7eb").lineWidth(0.5).moveTo(30, y + 18).lineTo(565, y + 18).stroke();
      
      y += 25;

      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});
// Secure deletion route using POST
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

    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Failed to delete book", error });
  }
});

// Return a borrowed book
router.put("/return/:id", async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { returned: true },
      { new: true }
    );
    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json({ message: "Book marked as returned", book: updatedBook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all overdue books
router.get("/overdue", async (req, res) => {
  try {
    const today = new Date();
    const overdueBooks = await Book.find({
      returnDate: { $lt: today },
      returned: false, // Only fetch books not yet returned
    });
    res.json(overdueBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch overdue books" });
  }
});

// backend/routes/book.routes.js

// backend/routes/book.routes.js

router.get("/reports/overdue-books/pdf", async (req, res) => {
  try {
    const today = new Date();
    const books = await Book.find({
      returnDate: { $lt: today },
      returned: false,
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=overdue-books.pdf");
    doc.pipe(res);

    // --- HEADER SECTION (Matches Active Books Style) ---
    doc.fillColor("#b91c1c").fontSize(20).font("Helvetica-Bold").text("M'SALEM SCHOOL LIBRARY", { align: "center" });
    doc.fillColor("#4b5563").fontSize(12).font("Helvetica").text("Detailed Overdue Books Report", { align: "center" });
    
    // Add a small "Urgent" badge or timestamp
    doc.moveDown(0.5);
    doc.fillColor("#ef4444").fontSize(9).text(`Status: ACTION REQUIRED | As of: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.moveDown(1);

    // --- TABLE CONFIGURATION ---
    const colTitle = 30;
    const colBorrower = 160;
    const colCategory = 290;
    const colOutDate = 410; // Optional: added to show how long it's been out
    const colDueDate = 490;
    const tableTop = 135;

    // --- TABLE HEADER ROW ---
    doc.rect(30, tableTop - 5, 535, 20).fill("#b91c1c"); // Dark Red Header
    doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
    doc.text("TITLE", colTitle, tableTop);
    doc.text("BORROWER", colBorrower, tableTop);
    doc.text("CATEGORY/CLASS", colCategory, tableTop);
    doc.text("OUT", colOutDate, tableTop);
    doc.text("DUE DATE", colDueDate, tableTop);

    let y = tableTop + 20;
    doc.font("Helvetica").fontSize(8);

    books.forEach((book, index) => {
      // Zebra Stripe (Light Red for overdue)
      if (index % 2 === 0) {
        doc.rect(30, y - 5, 535, 25).fill("#fef2f2");
      }

      doc.fillColor("#000000");
      
      // Data with substring limits
      doc.text(book.title.substring(0, 28), colTitle, y);
      doc.text(book.borrowerName.substring(0, 25), colBorrower, y);
      
      const classInfo = `${book.category}${book.subCategory ? ' / ' + book.subCategory : ''}`;
      doc.text(classInfo.substring(0, 24), colCategory, y);
      
      doc.text(new Date(book.borrowedDate).toLocaleDateString(), colOutDate, y);
      
      // Highlight the due date in red
      doc.fillColor("#b91c1c").font("Helvetica-Bold");
      doc.text(new Date(book.returnDate).toLocaleDateString(), colDueDate, y);
      doc.fillColor("#000000").font("Helvetica");

      // Row separator line
      doc.strokeColor("#fee2e2").lineWidth(0.5).moveTo(30, y + 18).lineTo(565, y + 18).stroke();
      
      y += 25;

      // Handle Page Breaks
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    // Final Footer
    doc.fontSize(7).fillColor("#9ca3af").text("Generated by Library Management System", 30, 785, { align: "left" });
    doc.text(`Page 1 of 1`, 500, 785, { align: "right" });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});
// Get archived (returned) books
router.get("/archived", async (req, res) => {
  try {
    const books = await Book.find({ returned: true });
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch archived books", error });
  }
});

module.exports = router;
