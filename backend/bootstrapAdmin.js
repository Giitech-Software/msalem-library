// backend/bootstrapAdmin.js
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let Admin;
function getAdminModel() {
  if (!Admin) Admin = require('./models/Admin');
  return Admin;
}

async function bootstrapAdmin() {
  // DATA_DIR is already set by server.js before this runs
  const dataDir = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.resolve(__dirname, 'data'); // backend/data/ — never backend/models/

  // Ensure the data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const Admin = getAdminModel();
  const existingAdmins = await Admin.find();

  if (existingAdmins.length > 0) {
    console.log('[Bootstrap] Admin account(s) already exist — skipping seed.');
    return;
  }

  // Pull credentials from .env only — no seed file, no hardcoded values
  const email    = process.env.SUPER_ADMIN_EMAIL
                || process.env.ADMIN_EMAIL
                || process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD
                || process.env.ADMIN_PASSWORD
                || process.env.DEFAULT_ADMIN_PASSWORD;
  const name     = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    console.warn('[Bootstrap] ⚠️  No SUPER_ADMIN_EMAIL/PASSWORD in .env — no admin seeded.');
    console.warn('[Bootstrap]    Run "node manageAdmin.js" after setting credentials in .env');
    return;
  }

  await Admin.create({ name, email, password, role: 'superadmin', status: 'active' });
  console.log('─────────────────────────────────────────────');
  console.log('[Bootstrap] ✅ Super admin created.');
  console.log(`[Bootstrap]    Email : ${email}`);
  console.log(`[Bootstrap]    Dir   : ${dataDir}`);
  console.log('─────────────────────────────────────────────');
}

function repairDatabaseFiles(dataDir) {
  const databaseFiles = [
    'admins.db', 'archived_students.db', 'books.db', 'book_catalog.db',
    'categories.db', 'financial_records.db', 'general_users.db',
    'logs.db', 'staff.db', 'students.db',
  ];
  const backupDir = path.join(dataDir, 'backups', new Date().toISOString().replace(/[:.]/g, '-'));
  for (const fileName of databaseFiles) {
    repairDatabaseFile(path.join(dataDir, fileName), backupDir);
  }
}

function repairDatabaseFile(dbPath, backupDir) {
  if (!fs.existsSync(dbPath)) return;

  const lines = fs.readFileSync(dbPath, 'utf8').split(/\r?\n/);
  let changed = false;

  const repairedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    try {
      const doc = JSON.parse(trimmed);

      if (
        doc.$$indexCreated?.fieldName === 'name' &&
        doc.$$indexCreated?.unique === true &&
        ['students.db', 'staff.db', 'general_users.db'].includes(path.basename(dbPath))
      ) {
        doc.$$indexCreated.unique = false;
        changed = true;
        console.log(`[Repair] Relaxed unique name index in ${path.basename(dbPath)}`);
        return JSON.stringify(doc);
      }

      if (Object.prototype.hasOwnProperty.call(doc, '_id') && !doc._id) {
        doc._id = crypto.randomBytes(8).toString('hex');
        changed = true;
        console.log(`[Repair] Fixed null _id in ${path.basename(dbPath)}`);
        return JSON.stringify(doc);
      }
    } catch { return line; }
    return line;
  });

  if (changed) {
    fs.mkdirSync(backupDir, { recursive: true });
    fs.copyFileSync(dbPath, path.join(backupDir, path.basename(dbPath)));
    const tempPath = `${dbPath}.repair-${process.pid}.tmp`;
    fs.writeFileSync(tempPath, repairedLines.join('\n'), 'utf8');
    fs.renameSync(tempPath, dbPath);
    console.log(`[Repair] Backup created at ${backupDir}`);
  }
}

module.exports = bootstrapAdmin;
module.exports.repairDatabaseFiles = repairDatabaseFiles;
