const path = require('path');
const fs = require('fs');
const Datastore = require('nedb-promises');

// Helper to get the correct path to NeDB files
const getDBPath = (fileName) => {
  const dbDir = process.env.APPDATA 
    ? path.join(process.env.APPDATA, 'msalem-library', 'database')
    : path.join(require('os').homedir(), 'AppData', 'Roaming', 'msalem-library', 'database');
    
  return path.join(dbDir, fileName);
};

const resetDevData = async () => {
  const target = process.argv[2];
  console.log(`📡 Targeting NeDB files in: ${path.dirname(getDBPath('admins.db'))}`);

  try {
    // 1. Initialize Datastores
    const dbs = {
      students: Datastore.create(getDBPath('students.db')),
      archivedStudents: Datastore.create(getDBPath('archived_students.db')),
      staff: Datastore.create(getDBPath('staff.db')),
      logs: Datastore.create(getDBPath('logs.db')),
      borrowing: Datastore.create(getDBPath('books.db')),
      catalog: Datastore.create(getDBPath('book_catalog.db')),
      categories: Datastore.create(getDBPath('categories.db')),
      users: Datastore.create(getDBPath('general_users.db')),
      finance: Datastore.create(getDBPath('finance.db')),
      admins: Datastore.create(getDBPath('admins.db'))
    };

    switch (target) {
      case 'students':
        await dbs.students.remove({}, { multi: true });
        await dbs.archivedStudents.remove({}, { multi: true });
        console.log("✅ UI CLEANED: Students and Archives emptied.");
        break;

      case 'staff':
        await dbs.staff.remove({}, { multi: true });
        console.log("✅ UI CLEANED: Staff List emptied.");
        break;

      case 'logs':
        await dbs.logs.remove({}, { multi: true });
        console.log("✅ UI CLEANED: Security Logs emptied.");
        break;

      case 'catalog':
        await dbs.catalog.remove({}, { multi: true });
        await dbs.categories.remove({}, { multi: true });
        console.log("✅ UI CLEANED: Catalog and Categories emptied.");
        break;

      case 'all':
        console.log("⚠️ STARTING FULL RESET...");
        for (const key in dbs) {
          if (key === 'admins') {
            // PROTECT SUPERADMIN: Only delete standard admins
            await dbs.admins.remove({ role: { $ne: "superadmin" } }, { multi: true });
          } else {
            await dbs[key].remove({}, { multi: true });
          }
        }
        console.log("🔥 SUCCESS: All pages wiped. Only Superadmin remains.");
        break;

      default:
        console.log("\n❌ Invalid Target. Use: students, staff, logs, catalog, or all.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Reset Error:", err.message);
    process.exit(1);
  }
};

resetDevData();