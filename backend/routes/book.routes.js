const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Admin = require("../models/Admin");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

// --- EMAIL CONFIGURATION ---
// Ensure these variables are set in your .env file
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * REUSABLE PDF GENERATOR
 * Handles styling for both Active (Green) and Overdue (Red) reports
 * Sends as Email if recipientEmail is provided, otherwise streams to Response
 */
const generateLibraryPDF = async (res, books, config, recipientEmail = null) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  let buffers = [];

  // Capture the stream if we are emailing
  if (recipientEmail) {
    doc.on('data', buffers.push.bind(buffers));
  } else {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${config.fileName}.pdf`);
    doc.pipe(res);
  }

  doc.on('end', async () => {
    if (recipientEmail) {
      const pdfBuffer = Buffer.concat(buffers);
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: `📊 Library Report: ${config.title}`,
        text: `Attached is the ${config.title} generated on ${new Date().toLocaleDateString()}.`,
        attachments: [{ filename: `${config.fileName}.pdf`, content: pdfBuffer }],
      };

      try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: "Report sent to email successfully!" });
      } catch (error) {
        console.error("Nodemailer Error:", error);
        return res.status(500).json({ message: "Failed to send email. Check SMTP settings." });
      }
    }
  });

  // --- PDF STYLING ---
  const primaryColor = config.isOverdue ? "#b91c1c" : "#15803d";
  const zebraColor = config.isOverdue ? "#fef2f2" : "#f3f4f6";

  // Header
  doc.fillColor(primaryColor).fontSize(20).font("Helvetica-Bold").text("M'SALEM SCHOOL LIBRARY", { align: "center" });
  doc.fillColor("#4b5563").fontSize(12).font("Helvetica").text(config.title, { align: "center" });
  doc.moveDown(1);

  // Table Config
  const cols = { title: 30, borrower: 160, category: 290, out: 410, due: 490 };
  const tableTop = 130;

  // Header Row
  doc.rect(30, tableTop - 5, 535, 20).fill(primaryColor);
  doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
  doc.text("TITLE", cols.title, tableTop);
  doc.text("BORROWER", cols.borrower, tableTop);
  doc.text("CATEGORY/CLASS", cols.category, tableTop);
  doc.text("OUT", cols.out, tableTop);
  doc.text("DUE", cols.due, tableTop);

  let y = tableTop + 20;
  doc.font("Helvetica").fontSize(8);

  books.forEach((book, index) => {
    if (index % 2 === 0) doc.rect(30, y - 5, 535, 25).fill(zebraColor);
    
    doc.fillColor("#000000");
    doc.text(book.title.substring(0, 28), cols.title, y);
    doc.text(book.borrowerName.substring(0, 25), cols.borrower, y);
    
    const classInfo = `${book.category}${book.subCategory ? ' / ' + book.subCategory : ''}`;
    doc.text(classInfo.substring(0, 24), cols.category, y);
    
    doc.text(new Date(book.borrowedDate).toLocaleDateString(), cols.out, y);

    // Highlight due date if overdue
    if (config.isOverdue) doc.fillColor(primaryColor).font("Helvetica-Bold");
    doc.text(new Date(book.returnDate).toLocaleDateString(), cols.due, y);
    doc.fillColor("#000000").font("Helvetica");

    y += 25;
    if (y > 750) { doc.addPage(); y = 50; }
  });

  doc.end();
};

// --- CORE ROUTES ---

router.post("/borrow", async (req, res) => {
  try {
    const existing = await Book.findOne({ borrowerName: req.body.borrowerName, returned: false });
    if (existing) return res.status(400).json({ message: "This borrower must return their previous book first." });
    const book = new Book(req.body);
    await book.save();
    res.status(201).json({ message: "Book borrowed successfully", book });
  } catch (error) { res.status(500).json({ message: "Failed to borrow book" }); }
});

router.get("/active", async (req, res) => {
  try {
    const books = await Book.find({ returned: false });
    res.status(200).json(books);
  } catch (error) { res.status(500).json({ message: "Failed to fetch active books" }); }
});

router.get("/overdue", async (req, res) => {
  try {
    const today = new Date();
    const books = await Book.find({ returnDate: { $lt: today }, returned: false });
    res.json(books);
  } catch (err) { res.status(500).json({ error: "Failed to fetch overdue books" }); }
});

// --- REPORT ROUTES ---

router.get("/reports/active-books/pdf", async (req, res) => {
  try {
    const books = await Book.find({ returned: false });
    await generateLibraryPDF(res, books, {
      title: "Detailed Active Borrowed Books Report",
      fileName: "active-books",
      isOverdue: false
    }, req.query.email);
  } catch (error) { res.status(500).json({ message: "Failed to process PDF" }); }
});

router.get("/reports/overdue-books/pdf", async (req, res) => {
  try {
    const today = new Date();
    const books = await Book.find({ returnDate: { $lt: today }, returned: false });
    await generateLibraryPDF(res, books, {
      title: "Detailed Overdue Books Report",
      fileName: "overdue-books",
      isOverdue: true
    }, req.query.email);
  } catch (error) { res.status(500).json({ message: "Failed to process PDF" }); }
});

// --- UTILITY ROUTES ---

router.put("/return/:id", async (req, res) => {
  try {
    await Book.findByIdAndUpdate(req.params.id, { returned: true });
    res.status(200).json({ message: "Book marked as returned" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/delete/:id", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    await Book.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) { res.status(500).json({ message: "Delete failed" }); }
});

router.get("/archived", async (req, res) => {
  try {
    const books = await Book.find({ returned: true });
    res.status(200).json(books);
  } catch (error) { res.status(500).json({ message: "Failed to fetch archived books" }); }
});

module.exports = router;