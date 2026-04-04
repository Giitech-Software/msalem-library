require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin'); 

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/msalem_library';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // INFO FOR THE NEW SUPERADMIN
    const newAdminEmail = 'astemlibrary@gmail.com'; // Your 2nd email
    const plainPassword = 'astem@2025'; 

    let admin = await Admin.findOne({ email: newAdminEmail });

    if (!admin) {
      console.log(`⚠️ ${newAdminEmail} not found. Creating...`);
      
      // IMPORTANT: We pass 'plainPassword'. 
      // The Admin model middleware will hash this once before saving.
      admin = await Admin.create({
        email: newAdminEmail,
        password: plainPassword, 
        role: 'superadmin'
      });
      
      console.log('✅ New Superadmin created:', admin.email);
    } else {
      // If it exists but login fails, we reset it to fix the double-hash
      console.log('🔄 Admin exists. Resetting password to ensure single-hash...');
      admin.password = plainPassword; 
      admin.role = 'superadmin';
      await admin.save();
      console.log('✅ Password and Role updated successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

main();