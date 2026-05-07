
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let Admin;

function getAdminModel() {
  if (!Admin) {
    Admin = require('./models/Admin');
  }

  return Admin;
}

function parseSeedAdmins(seedPath) {
  if (!fs.existsSync(seedPath)) return [];

  return fs.readFileSync(seedPath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        const admin = JSON.parse(line);
        delete admin._id;
        return admin;
      } catch (err) {
        console.error(`[Admin Bootstrap] Skipping invalid seed row: ${err.message}`);
        return null;
      }
    })
    .filter(Boolean);
}

function getEnvAdmin() {
  const email = process.env.ADMIN_EMAIL || process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD || process.env.DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) return null;

  return {
    email,
    password,
    role: process.env.ADMIN_ROLE || 'superadmin',
    status: 'active',
  };
}

async function bootstrapAdmin() {
  repairDatabaseFiles();

  const Admin = getAdminModel();
  const existingAdmins = await Admin.find();
  if (existingAdmins.length > 0) return;

  const adminsToCreate = [];
  const envAdmin = getEnvAdmin();
  if (envAdmin) adminsToCreate.push(envAdmin);

  const seedPath = path.join(__dirname, 'models', 'admins.db');
  adminsToCreate.push(...parseSeedAdmins(seedPath));

  const seenEmails = new Set();
  for (const admin of adminsToCreate) {
    const email = admin.email?.trim().toLowerCase();
    if (!email || !admin.password || seenEmails.has(email)) continue;

    seenEmails.add(email);
    await Admin.create({ ...admin, email });
    console.log(`[Admin Bootstrap] Created ${admin.role || 'admin'} account: ${email}`);
  }

  if (seenEmails.size === 0) {
    console.warn('[Admin Bootstrap] No admin accounts found and no seed credentials configured.');
  }
}

function repairDatabaseFiles() {
  const dataDir = process.env.DATA_DIR || path.join(__dirname, 'models');
  const databaseFiles = [
    'admins.db',
    'archived_students.db',
    'books.db',
    'book_catalog.db',
    'categories.db',
    'financial_records.db',
    'general_users.db',
    'logs.db',
    'staff.db',
    'students.db',
  ];

  for (const fileName of databaseFiles) {
    repairDatabaseFile(path.join(dataDir, fileName));
  }
}

function repairDatabaseFile(dbPath) {
  if (!fs.existsSync(dbPath)) return;

  const lines = fs.readFileSync(dbPath, 'utf8').split(/\r?\n/);
  let changed = false;

  const repairedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    try {
      const doc = JSON.parse(trimmed);

      if (
        doc.$$indexCreated &&
        doc.$$indexCreated.fieldName === 'name' &&
        doc.$$indexCreated.unique === true &&
        ['students.db', 'staff.db', 'general_users.db'].includes(path.basename(dbPath))
      ) {
        doc.$$indexCreated.unique = false;
        changed = true;
        console.log(`[Database Repair] Relaxed unique name index in ${path.basename(dbPath)}`);
        return JSON.stringify(doc);
      }

      if (Object.prototype.hasOwnProperty.call(doc, '_id') && !doc._id) {
        doc._id = crypto.randomBytes(8).toString('hex');
        changed = true;
        console.log(`[Database Repair] Repaired null id in ${path.basename(dbPath)}: ${doc.email || doc.name || doc.title || 'record'}`);
        return JSON.stringify(doc);
      }
    } catch (err) {
      return line;
    }

    return line;
  });

  if (changed) {
    fs.writeFileSync(dbPath, repairedLines.join('\n'), 'utf8');
  }
}

module.exports = bootstrapAdmin;
