// backend/manageAdmin.js
// Usage (dev):        node manageAdmin.js
// Usage (production): DATA_DIR is set by Electron automatically
const path = require('path');
const fs   = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Mirror exactly what Electron's main.js does:
// - In production: Electron passes DATA_DIR=AppData/database via fork env
// - In dev:        We fall back to backend/data/ so it matches the dev server
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, 'data'); // backend/data/

process.env.DATA_DIR = DATA_DIR; // Ensure Admin.js sees the same path

const Admin = require('./models/Admin');

async function manageAdmin() {
  console.log('--- M-Salem Admin Management Tool ---');
  console.log(`Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database    : ${DATA_DIR}`);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const name     = process.env.SUPER_ADMIN_NAME     || 'Super Admin';
  const email    = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env first.');
    process.exit(1);
  }

  try {
    const existing = await Admin.findOne({ email });

    if (existing) {
      await Admin.update(existing._id, { name, password, role: 'superadmin', status: 'active' });
      console.log('✅ Super admin credentials updated.');
    } else {
      await Admin.create({ name, email, password, role: 'superadmin', status: 'active' });
      console.log('✅ Super admin created.');
    }

    console.log(`   Email : ${email}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

manageAdmin();