// manageAdmin.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const userDataPath = process.env.APPDATA
  ? path.join(process.env.APPDATA, 'msalem-library', 'database')
  : path.join(require('os').homedir(), 'AppData', 'Roaming', 'msalem-library', 'database');

process.env.DATA_DIR = process.env.DATA_DIR || userDataPath;

const Admin = require('./models/Admin');

async function setupSuperAdmin() {
  try {
    const adminEmail = 'mm';
    const plainPassword = 's5';

    if (!fs.existsSync(process.env.DATA_DIR)) {
      fs.mkdirSync(process.env.DATA_DIR, { recursive: true });
    }

    console.log(`--- M-Salem Admin Management Tool ---`);
    console.log(`Target Database Path: ${process.env.DATA_DIR}`);

    // 2. CHECK AND CREATE
    let admin = await Admin.findOne({ email: adminEmail });

    if (!admin) {
      await Admin.create({
        name: 'Super Admin',
        email: adminEmail,
        password: plainPassword, 
        role: 'superadmin',
        status: 'active'
      });
      console.log('✅ Success: Superadmin created in Electron directory.');
    } else {
      await Admin.update(admin._id, {
        password: plainPassword,
        role: 'superadmin',
        status: 'active'
      });
      console.log('✅ Success: Credentials updated in Electron directory.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

setupSuperAdmin();
