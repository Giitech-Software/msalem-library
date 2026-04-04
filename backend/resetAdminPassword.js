// backend/resetAdminPassword.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/msalem_library';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'astemlibrary@gmail.com';
    const newPassword = 'astem@2025'; // put the password you want to use

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const admin = await Admin.findOneAndUpdate(
      { email: adminEmail },
      { password: hashedPassword },
      { new: true }
    );

    if (admin) {
      console.log(`✅ Password updated for ${admin.email}`);
    } else {
      console.log(`⚠️ Admin not found: ${adminEmail}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

main();