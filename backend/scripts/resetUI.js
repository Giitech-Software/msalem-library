const mongoose = require('mongoose');
const dotenv = require('dotenv');

// --- Import All Relevant Models ---
const Admin = require('../models/Admin');
const Book = require('../models/Book'); // Borrowing Transactions
const Log = require('../models/Log');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const ArchivedStudent = require('../models/ArchivedStudent');
const BookCatalog = require('../models/BookCatalog'); // Library Inventory
const Category = require('../models/Category'); // Dropdown Categories

dotenv.config();

const resetDevData = async () => {
  const target = process.argv[2]; 

  try {
    // Check if URI exists to prevent silent crashes
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to Database.");

    switch (target) {
      case 'students':
        await Student.deleteMany({});
        await ArchivedStudent.deleteMany({});
        console.log("✅ UI CLEANED: Student List and Archives are now empty.");
        break;

      case 'staff':
        await Staff.deleteMany({});
        console.log("✅ UI CLEANED: Staff List is now empty.");
        break;

      case 'logs':
        await Log.deleteMany({});
        console.log("✅ UI CLEANED: Security Logs are now empty.");
        break;

      case 'borrowing':
        await Book.deleteMany({});
        console.log("✅ UI CLEANED: Active/Archived Books pages are now empty.");
        break;

      case 'catalog':
        await BookCatalog.deleteMany({});
        await Category.deleteMany({});
        console.log("✅ UI CLEANED: Book Catalog and Categories are now empty.");
        break;

      case 'all':
        console.log("⚠️  STARTING FULL DEVELOPMENT RESET...");
        
        // Wipe Transactional Data
        await Log.deleteMany({});
        await Book.deleteMany({});
        await Student.deleteMany({});
        await Staff.deleteMany({});
        await ArchivedStudent.deleteMany({});
        
        // Wipe Inventory Data
        await BookCatalog.deleteMany({});
        await Category.deleteMany({});
        
        // Wipe User Data (PROTECT SUPERADMIN)
        const adminResult = await Admin.deleteMany({ role: { $ne: "superadmin" } });
        
        console.log(`🧹 Admin accounts cleared: ${adminResult.deletedCount} removed.`);
        console.log("🔥 SUCCESS: All UI pages are wiped. Only your Superadmin remains.");
        break;

      default:
        console.log("\n❌ Invalid Target. Please use one of the following:");
        console.log("   node scripts/resetUI.js students  -> Clear Students & Archives");
        console.log("   node scripts/resetUI.js staff     -> Clear Staff List");
        console.log("   node scripts/resetUI.js logs      -> Clear Security Logs");
        console.log("   node scripts/resetUI.js borrowing -> Clear Borrowing Transactions");
        console.log("   node scripts/resetUI.js catalog   -> Clear Book Inventory & Categories");
        console.log("   node scripts/resetUI.js all       -> Wipe Everything (Except Superadmin)");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Reset Error:", err.message);
    process.exit(1);
  }
};

resetDevData();