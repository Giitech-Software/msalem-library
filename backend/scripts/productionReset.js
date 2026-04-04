//backend/scripts/productionReset.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import your Models
const Log = require('../models/Log');
const Book = require('../models/Book'); // This refers to the 'borrowed' records in your setup
const Admin = require('../models/Admin');

dotenv.config();

const resetProductionData = async () => {
  try {
    console.log("🚀 Starting Production Readiness Reset...");
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to Database.");

    // 1. PURGE SECURITY LOGS (The Audit Trail)
    const logResult = await Log.deleteMany({});
    console.log(`🧹 Cleared Security Logs: ${logResult.deletedCount} entries removed.`);

    // 2. PURGE BORROWING HISTORY (Active and Archived Books)
    // Note: In your current schema, 'Book' stores individual borrowing transactions.
    const bookResult = await Book.deleteMany({});
    console.log(`📚 Cleared Borrowing Records: ${bookResult.deletedCount} transactions removed.`);

    // 3. CLEANUP ADMINS (Optional but Recommended)
    // We remove all "admin" roles but KEEP "superadmin" so you can still log in.
    const adminResult = await Admin.deleteMany({ role: { $ne: "superadmin" } });
    console.log(`👤 Cleared Staff Accounts: ${adminResult.deletedCount} standard admins removed.`);
    
    // 4. RESET SUPERADMIN STATUS (Optional)
    // If you've been testing "Suspension" on yourself, this forces you back to Active.
    await Admin.updateMany({ role: "superadmin" }, { status: "active" });
    console.log("👑 Superadmin accounts verified and set to 'active'.");

    console.log("\n✅ DATABASE IS NOW PRODUCTION-READY.");
    console.log("⚠️ Reminder: Ensure your .env is pointing to the LIVE database before deployment.");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Reset Failed:", err);
    process.exit(1);
  }
};

resetProductionData();