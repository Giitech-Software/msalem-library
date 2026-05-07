const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Admin = require("../models/Admin");
const Log = require("../models/Log"); 
const FinancialRecord = require("../models/FinancialRecord");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const auth = require("../middleware/auth"); 
const path = require("path"); 
const fs = require("fs"); 

const Student = require("../models/Student"); 
const Staff = require("../models/Staff");     
const GeneralUser = require("../models/GeneralUser");

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Utility to handle the "Smart Feeder" sync without Mongoose findOneAndUpdate
const syncUserData = async (category, borrowerName, borrowerId, contact, subCategory) => {
  const userData = { name: borrowerName, category, subCategory, contact };
  
  if (category === "Staff") {
    let staff = await Staff.findOne({ name: borrowerName });
    if (staff) { Object.assign(staff, { ...userData, staffId: borrowerId }); await staff.save(); }
    else { await Staff.create({ ...userData, staffId: borrowerId }); }
  } else if (category === "General User") {
    let gUser = await GeneralUser.findOne({ name: borrowerName });
    if (gUser) { Object.assign(gUser, { ...userData, borrowerId }); await gUser.save(); }
    else { await GeneralUser.create({ ...userData, borrowerId }); }
  } else if (category) {
    let student = await Student.findOne({ name: borrowerName });
    if (student) { Object.assign(student, { ...userData, studentId: borrowerId }); await student.save(); }
    else { await Student.create({ ...userData, studentId: borrowerId }); }
  }
};

const endOfDay = (value) => new Date(new Date(value).setHours(23, 59, 59, 999));

const isWithinDateRange = (value, startDate, endDate) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (startDate && date < new Date(startDate)) return false;
  if (endDate && date > endOfDay(endDate)) return false;
  return true;
};

const getActivePhysicalBooks = async () => Book.find({ returned: false, bookType: "Physical" });

/**
 * REUSABLE PDF GENERATOR (Kept Intact)
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
        if (!res.headersSent) res.status(200).json({ message: "Email sent successfully!" });
      } catch (error) {
        if (!res.headersSent) res.status(500).json({ message: "Email failed to send." });
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
    const displayDate = book.returnDate ? new Date(book.returnDate).toLocaleDateString() : "N/A (Digital)";
    doc.text(displayDate, cols.due, y);
    
    doc.fillColor("#000000").font("Helvetica");
    y += 25;
    if (y > 750) { doc.addPage(); y = 50; }
  });
  doc.end();
};

// --- CORE ROUTES ---

router.post("/borrow", auth, async (req, res) => { 
  try {
    const { 
      bookType, borrowerName, title, deliveryMethod, contact, 
      pdfUrl, borrowerId, category, subCategory, borrowingCost 
    } = req.body;

    if (bookType === "Physical") {
      const existing = await Book.findOne({ borrowerName, returned: false, bookType: "Physical" });
      if (existing) return res.status(400).json({ message: "Borrower must return previous physical book first." });
    }
    
    const isDigital = bookType === "Digital";

    // --- STANDALONE PATH RESOLUTION ---
    let filePath = "";
    if (isDigital) {
      if (!pdfUrl) return res.status(400).json({ message: "Digital book has no file attached." });
      const fileName = path.basename(pdfUrl);
      filePath = path.join(process.env.DATA_DIR, "uploads", "pdfs", fileName);
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: "PDF file not found on server." });
    }

    // --- SYNC USER DATA (Standalone Logic) ---
    await syncUserData(category, borrowerName, borrowerId, contact, subCategory);

    const bookData = { 
      ...req.body, 
      returned: isDigital, 
      status: isDigital ? "Dispatched" : "Borrowed",
      returnDate: isDigital ? undefined : req.body.returnDate,
      dispatchStatus: isDigital ? "Pending" : "N/A"
    };

    const book = await Book.create(bookData);

    if (borrowingCost && borrowingCost > 0) {
      await FinancialRecord.create({
        title, borrowerName, borrowerId, bookType,
        amount: Number(borrowingCost),
        issuedBy: req.admin.email,
        date: new Date()
      });
    }

    // EMAIL DISPATCH
    if (isDigital && deliveryMethod === "Email" && contact?.includes("@")) {
      const mailOptions = {
        from: `"M'Salem School Library" <${process.env.EMAIL_USER}>`,
        to: contact,
        subject: `📖 Your Digital Book: ${title}`,
        html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 500px;">
                <h2 style="color: #15803d;">M'SALEM LIBRARY</h2>
                <p>Hello <strong>${borrowerName}</strong>, your digital book is attached.</p>
              </div>`,
        attachments: [{ filename: `${title.replace(/\s+/g, '_')}.pdf`, path: filePath }]
      };
      try {
        await transporter.sendMail(mailOptions);
        book.dispatchStatus = "Sent";
        await book.save();
      } catch (mailError) {
        book.dispatchStatus = "Failed";
        await book.save();
      }
    }

    await Log.create({
      adminEmail: req.admin.email,
      action: isDigital ? "Digital Dispatch" : "Book Borrowed",
      details: `Issued "${title}" to ${borrowerName} for GHS ${borrowingCost || 0}`
    });

    res.status(201).json({ message: isDigital ? "Digital dispatch successful!" : "Book issued successfully", book });
  } catch (error) { 
    res.status(500).json({ message: error.message || "Failed to process issuance" }); 
  }
});

router.get("/active", async (req, res) => {
  try {
    const books = await getActivePhysicalBooks();
    res.status(200).json(books);
  } catch (error) { res.status(500).json({ message: "Failed to fetch active books" }); }
});

router.get("/borrowed", async (req, res) => {
  try {
    const books = await getActivePhysicalBooks();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch borrowed books" });
  }
});

router.get("/overdue", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const books = (await getActivePhysicalBooks()).filter((book) => {
      const dueDate = new Date(book.returnDate);
      if (Number.isNaN(dueDate.getTime()) || dueDate >= today) return false;
      return !startDate && !endDate ? true : isWithinDateRange(dueDate, startDate, endDate);
    });
    res.json(books);
  } catch (err) { res.status(500).json({ error: "Failed to fetch overdue books" }); }
});

router.get("/reports/active-books/pdf", async (req, res) => {
  try {
    const { startDate, endDate, email } = req.query;
    let books = await getActivePhysicalBooks();
    if (startDate || endDate) {
      books = books.filter((book) => isWithinDateRange(book.borrowedDate, startDate, endDate));
    }
    books.sort((a,b) => new Date(b.borrowedDate) - new Date(a.borrowedDate));
    await generateLibraryPDF(res, books, {
      title: startDate && endDate ? `Active Books: ${startDate} to ${endDate}` : "Detailed Active Borrowed Books Report",
      fileName: `active-books-${startDate || 'all'}`,
      isOverdue: false
    }, email);
  } catch (error) { res.status(500).json({ message: "Failed to process PDF" }); }
});

router.get("/reports/overdue-books/pdf", async (req, res) => {
  try {
    const { startDate, endDate, email } = req.query;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const books = (await getActivePhysicalBooks()).filter((book) => {
      const dueDate = new Date(book.returnDate);
      if (Number.isNaN(dueDate.getTime()) || dueDate >= today) return false;
      return !startDate && !endDate ? true : isWithinDateRange(dueDate, startDate, endDate);
    });
    books.sort((a, b) => new Date(a.returnDate) - new Date(b.returnDate));

    await generateLibraryPDF(res, books, {
      title: startDate || endDate ? `Overdue Books: ${startDate || "start"} to ${endDate || "today"}` : "Overdue Books Report",
      fileName: `overdue-books-${startDate || "all"}`,
      isOverdue: true
    }, email);
  } catch (error) {
    res.status(500).json({ message: "Failed to process overdue PDF" });
  }
});

router.post("/remind/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const contact = book.contact?.trim();
    if (!contact || !contact.includes("@")) {
      return res.status(400).json({ message: "This borrower does not have a valid email address." });
    }

    await transporter.sendMail({
      from: `"M'Salem School Library" <${process.env.EMAIL_USER}>`,
      to: contact,
      subject: `Library Reminder: ${book.title}`,
      text: `Hello ${book.borrowerName}, this is a reminder to return "${book.title}". It was due on ${new Date(book.returnDate).toLocaleDateString()}.`,
    });

    await Log.create({
      adminEmail: req.admin.email,
      action: "Overdue Reminder Sent",
      details: `Sent reminder to ${book.borrowerName} for "${book.title}"`
    });

    res.status(200).json({ message: "Reminder sent successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send reminder email." });
  }
});

router.put("/return/:id", auth, async (req, res) => { 
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    book.returned = true;
    book.status = "Returned";
    await book.save();
    
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

    // NeDB doesn't have updateMany, we loop or use the datastore directly
    const records = await FinancialRecord.find({ borrowerId: book.borrowerId, title: book.title });
    for (let rec of records) {
        rec.isOrphaned = true;
        await rec.save();
    }

    await Book.findByIdAndDelete(req.params.id);

    await Log.create({
      adminEmail: email,
      action: "Book Deletion",
      details: `CRITICAL: Deleted record for "${book.title}" held by ${book.borrowerName}`
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
