const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Admin = require("../models/Admin");
const Log = require("../models/Log"); 
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const auth = require("../middleware/auth"); 

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * REUSABLE PDF GENERATOR
 */
const generateLibraryPDF = async (res, books, config, recipientEmail = null) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  let buffers = [];

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
        if (!res.headersSent) {
          res.status(200).json({ message: "Email sent successfully!" });
        }
      } catch (error) {
        console.error("Nodemailer Error:", error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Email failed to send." });
        }
      }
    }
  });

  const primaryColor = config.isOverdue ? "#b91c1c" : "#15803d";
  const zebraColor = config.isOverdue ? "#fef2f2" : "#f3f4f6";

  doc.fillColor(primaryColor).fontSize(20).font("Helvetica-Bold").text("M'SALEM SCHOOL LIBRARY", { align: "center" });
  doc.fillColor("#4b5563").fontSize(12).font("Helvetica").text(config.title, { align: "center" });
  doc.moveDown(1);

  const cols = { title: 30, borrower: 160, category: 290, out: 410, due: 490 };
  const tableTop = 130;

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
    doc.text((book.title || "").substring(0, 28), cols.title, y);
    doc.text((book.borrowerName || "").substring(0, 25), cols.borrower, y);
    const classInfo = `${book.category || ""}${book.subCategory ? ' / ' + book.subCategory : ''}`;
    doc.text(classInfo.substring(0, 24), cols.category, y);
    doc.text(new Date(book.borrowedDate).toLocaleDateString(), cols.out, y);
    if (config.isOverdue) doc.fillColor(primaryColor).font("Helvetica-Bold");
    doc.text(new Date(book.returnDate).toLocaleDateString(), cols.due, y);
    doc.fillColor("#000000").font("Helvetica");
    y += 25;
    if (y > 750) { doc.addPage(); y = 50; }
  });

  doc.end();
};

// --- CORE ROUTES ---

router.get("/borrowed", auth, async (req, res) => {
  try {
    const activeBooks = await Book.find({ returned: false });
    res.status(200).json(activeBooks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch borrowed records" });
  }
});

router.post("/borrow", auth, async (req, res) => { 
  try {
    const existing = await Book.findOne({ borrowerName: req.body.borrowerName, returned: false });
    if (existing) return res.status(400).json({ message: "This borrower must return their previous book first." });
    
    const bookData = { ...req.body, returned: false };
    const book = new Book(bookData);
    await book.save();

    await Log.create({
      adminEmail: req.admin.email,
      action: "Book Borrowed",
      details: `Lent "${book.title}" to ${book.borrowerName} (${book.category})`
    });

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
  } catch (error) { 
    if (!res.headersSent) res.status(500).json({ message: "Failed to process PDF" }); 
  }
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
  } catch (error) { 
    if (!res.headersSent) res.status(500).json({ message: "Failed to process PDF" }); 
  }
});

// --- INDIVIDUAL OVERDUE REMINDER ---
// ✅ NEW: Professional direct email to the borrower
router.post("/remind/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book record not found." });
    if (!book.contact || !book.contact.includes("@")) {
      return res.status(400).json({ message: "Borrower does not have a valid email address." });
    }

    const mailOptions = {
      from: `"M'Salem Library" <${process.env.EMAIL_USER}>`,
      to: book.contact,
      subject: "⚠️ Library Overdue Notice",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 2px solid #b91c1c; border-radius: 10px;">
          <h2 style="color: #b91c1c;">M'SALEM SCHOOL LIBRARY</h2>
          <p>Dear <strong>${book.borrowerName}</strong>,</p>
          <p>This is a professional reminder that the following book is currently overdue:</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Book Title:</strong> ${book.title}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(book.returnDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Borrower ID:</strong> ${book.borrowerId}</p>
          </div>
          <p>Please return the book to the library as soon as possible to avoid any further penalties.</p>
          <p>If you have already returned this book, please contact the librarian to update our records.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">This is an automated message from M'Salem School Library Management System.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Log the reminder action
    await Log.create({
      adminEmail: req.admin.email,
      action: "Reminder Sent",
      details: `Sent overdue reminder to ${book.borrowerName} for "${book.title}"`
    });

    res.status(200).json({ message: "Reminder sent to borrower!" });
  } catch (error) {
    console.error("Reminder Error:", error);
    res.status(500).json({ message: "Internal server error while sending email." });
  }
});

// --- UTILITY ROUTES ---

router.put("/return/:id", auth, async (req, res) => { 
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, { returned: true }, { new: true });
    
    await Log.create({
      adminEmail: req.admin.email,
      action: "Book Returned",
      details: `Book "${book.title}" was returned by ${book.borrowerName}`
    });

    res.status(200).json({ message: "Book marked as returned" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/delete/:id", auth, async (req, res) => { 
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const bookTitle = book.title;
    const borrower = book.borrowerName;

    await Book.findByIdAndDelete(req.params.id);

    await Log.create({
      adminEmail: email,
      action: "Book Deletion",
      details: `CRITICAL: Deleted record for "${bookTitle}" previously held by ${borrower}`
    });

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