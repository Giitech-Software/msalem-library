// backend/routes/book.routes.js
const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Admin = require("../models/Admin");
const Log = require("../models/Log"); 
const FinancialRecord = require("../models/FinancialRecord"); // ✅ NEW: Import the Vault
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
      pdfUrl, borrowerId, category, subCategory, borrowingCost // ✅ Extract borrowingCost
    } = req.body;

    // 1. Validation for Physical Books
    if (bookType === "Physical") {
      const existing = await Book.findOne({ borrowerName, returned: false, bookType: "Physical" });
      if (existing) return res.status(400).json({ message: "Borrower must return previous physical book first." });
    }
    
    const isDigital = bookType === "Digital";

    // --- VERIFY FILE EXISTS FOR DIGITAL ---
    let filePath = "";
    if (isDigital) {
      if (!pdfUrl) return res.status(400).json({ message: "Digital book has no file attached." });
      const fileName = path.basename(pdfUrl);
      filePath = path.resolve(__dirname, "..", "uploads", "pdfs", fileName);
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: "PDF file not found on server." });
    }

    // ============================================================
    // 🟢 SMART FEEDER: SYNC USER DATA (Kept Intact)
    // ============================================================
    const userData = {
      name: borrowerName,
      category: category,
      subCategory: subCategory,
      contact: contact,
    };

    if (category === "Staff") {
      await Staff.findOneAndUpdate({ name: borrowerName }, { ...userData, staffId: borrowerId }, { upsert: true, new: true });
    } else if (category === "General User") {
      await GeneralUser.findOneAndUpdate({ name: borrowerName }, { ...userData, borrowerId: borrowerId }, { upsert: true, new: true });
    } else if (category) {
      await Student.findOneAndUpdate({ name: borrowerName }, { ...userData, studentId: borrowerId }, { upsert: true, new: true });
    }

    // 2. Save Borrowing Record to Database
    const bookData = { 
      ...req.body, 
      returned: isDigital, 
      status: isDigital ? "Dispatched" : "Borrowed",
      returnDate: isDigital ? undefined : req.body.returnDate,
      dispatchStatus: isDigital ? "Pending" : "N/A"
    };

    const book = new Book(bookData);
    await book.save();

    // ============================================================
    // 💰 HIGH SECURITY FINANCIAL VAULT (NEW)
    // Even if 'book' is deleted, this record stays.
    // ============================================================
    if (borrowingCost && borrowingCost > 0) {
      await FinancialRecord.create({
        title: title,
        borrowerName: borrowerName,
        borrowerId: borrowerId,
        bookType: bookType,
        amount: borrowingCost,
        issuedBy: req.admin.email, // Log which admin handled the cash
        date: new Date()
      });
    }
    // --- 🟢 WHATSAPP DISPATCH LOGIC (COMMENTED OUT FOR ELECTRON) ---
    /*
    if (isDigital && deliveryMethod && deliveryMethod.toUpperCase() === "WHATSAPP") {
      console.log("🎯 WhatsApp Logic Triggered for:", contact);
      
      // 1. Format the number for Ghana (+233)
      let cleanNumber = contact.replace(/\D/g, ''); 
      if (cleanNumber.startsWith('0')) {
        cleanNumber = '233' + cleanNumber.substring(1);
      }

      // 2. Create the direct download link
      const fileName = path.basename(pdfUrl);
      const downloadUrl = `${req.protocol}://${req.get('host')}/uploads/pdfs/${fileName}`;

      // 3. Create the pre-filled WhatsApp message
      const message = `Hello ${borrowerName}, here is your digital book: *${title}*.\n\n📥 Download link: ${downloadUrl}`;
      const encodedMsg = encodeURIComponent(message);
      
      const waLink = `https://wa.me/${cleanNumber}?text=${encodedMsg}`;

      await Book.findByIdAndUpdate(book._id, { dispatchStatus: "WA_READY" });

      // Return the waLink so the Frontend can open it
      return res.status(201).json({ 
        message: "WhatsApp Link Generated!", 
        book, 
        waLink: waLink 
      });
    }
    */

    // 3. --- DIGITAL DISPATCH: EMAIL ---
    // 3. --- DIGITAL DISPATCH: EMAIL ---
    if (isDigital && deliveryMethod === "Email" && contact?.includes("@")) {
      const mailOptions = {
        from: `"M'Salem School Library" <${process.env.EMAIL_USER}>`,
        to: contact,
        subject: `📖 Your Digital Book: ${title}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 500px;">
            <h2 style="color: #15803d;">M'SALEM LIBRARY</h2>
            <p>Hello <strong>${borrowerName}</strong>,</p>
            <p>Your requested digital book <strong>"${title}"</strong> is attached below.</p>
            <hr>
            <p style="font-size: 11px; color: #666;">Automated Library Dispatch.</p>
          </div>
        `,
        attachments: [{
          filename: `${title.replace(/\s+/g, '_')}.pdf`,
          path: filePath,
          contentType: 'application/pdf'
        }]
      };

      try {
        await transporter.sendMail(mailOptions);
        await Book.findByIdAndUpdate(book._id, { dispatchStatus: "Sent" });
      } catch (mailError) {
        console.error("❌ NODEMAILER FAIL:", mailError.message);
        await Book.findByIdAndUpdate(book._id, { dispatchStatus: "Failed" });
      }
    }

    // 4. Log Action
   await Log.create({
      adminEmail: req.admin.email,
      action: isDigital ? "Digital Dispatch" : "Book Borrowed",
      details: `Issued "${book.title}" to ${book.borrowerName} for GHS ${borrowingCost || 0}`
    });

    res.status(201).json({ 
      message: isDigital ? "Digital dispatch successful!" : "Book issued successfully", 
      book 
    });

  } catch (error) { 
    console.error("Issuance Error:", error);
    res.status(500).json({ message: error.message || "Failed to process issuance" }); 
  }
});

// ✅ ADDED: Mark financial records as "Orphaned" if a book is deleted
router.post("/delete/:id", auth, async (req, res) => { 
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // Before deleting, update financial vault to show this record is now orphaned
    await FinancialRecord.updateMany(
      { borrowerId: book.borrowerId, title: book.title },
      { isOrphaned: true }
    );

    await Book.findByIdAndDelete(req.params.id);

    await Log.create({
      adminEmail: email,
      action: "Book Deletion",
      details: `CRITICAL: Deleted record for "${book.title}" held by ${book.borrowerName}. Financial record preserved.`
    });
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) { res.status(500).json({ message: "Delete failed" }); }
});

router.get("/active", async (req, res) => {
  try {
    const books = await Book.find({ returned: false, bookType: "Physical" });
    res.status(200).json(books);
  } catch (error) { res.status(500).json({ message: "Failed to fetch active books" }); }
});

router.get("/overdue", async (req, res) => {
  try {
    const today = new Date();
    const books = await Book.find({ returnDate: { $lt: today }, returned: false, bookType: "Physical" });
    res.json(books);
  } catch (err) { res.status(500).json({ error: "Failed to fetch overdue books" }); }
});

router.get("/reports/active-books/pdf", async (req, res) => {
  try {
    const { startDate, endDate, email } = req.query;
    let query = { returned: false };

    // Added Date Filter Logic
    if (startDate && endDate) {
      query.borrowedDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const books = await Book.find(query).sort({ borrowedDate: -1 });
    await generateLibraryPDF(res, books, {
      title: startDate && endDate ? `Active Books: ${startDate} to ${endDate}` : "Detailed Active Borrowed Books Report",
      fileName: `active-books-${startDate || 'all'}`,
      isOverdue: false
    }, email);
  } catch (error) { 
    if (!res.headersSent) res.status(500).json({ message: "Failed to process PDF" }); 
  }
});

// --- UPDATED OVERDUE PDF ROUTE ---
router.get("/reports/overdue-books/pdf", async (req, res) => {
  try {
    const today = new Date();
    const { startDate, endDate, email } = req.query;

    // 1. Core Query: Must be Physical, Not Returned, and Due before 'Today'
    let query = { 
      returned: false, 
      bookType: "Physical",
      returnDate: { $lt: today } 
    };

    // 2. Date Range Logic:
    // We filter by 'returnDate' because that defines when it became overdue.
    if (startDate && endDate) {
      query.returnDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    // 3. Fetch and Sort (Oldest overdue first is usually better for reports)
    const books = await Book.find(query).sort({ returnDate: 1 });

    // 4. Generate the PDF
    await generateLibraryPDF(res, books, {
      title: startDate && endDate 
        ? `Overdue Report: ${startDate} to ${endDate}` 
        : "Complete Overdue Inventory Report",
      fileName: `overdue-books-${startDate || 'all'}`,
      isOverdue: true
    }, email);

  } catch (error) { 
    console.error("PDF Export Error:", error);
    if (!res.headersSent) res.status(500).json({ message: "Failed to process PDF" }); 
  }
});

router.post("/remind/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book record not found." });
    if (book.bookType === "Digital") return res.status(400).json({ message: "Digital books do not require reminders." });
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
          <p>Please return the book as soon as possible.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Automated message from M'Salem School Library.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

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

router.put("/return/:id", auth, async (req, res) => { 
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, { returned: true, status: "Returned" }, { new: true });
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