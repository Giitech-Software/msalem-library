// backend/checkAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin'); // adjust path if needed

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/msalem_library';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const adminEmail = 'astemlibrary@gmail.com';
    let admin = await Admin.findOne({ email: adminEmail });

    if (!admin) {
      console.log('⚠️ Admin not found. Creating a new admin...');
      const hashedPassword = await bcrypt.hash('astem@2025', 10); // change to your desired password
      admin = await Admin.create({
        email: adminEmail,
        password: hashedPassword,
        role: 'superadmin'
      });
      console.log('✅ Admin created:', admin.email);
    } else {
      console.log('✅ Admin already exists:', admin.email);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

main();