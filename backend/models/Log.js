const Datastore = require('nedb-promises');
const path = require('path');

// Storage: logs.db
const dbPath = path.join(process.env.DATA_DIR || __dirname, 'logs.db');
const db = Datastore.create({ filename: dbPath, autoload: true });

// Indexing createdAt for fast chronological sorting
db.ensureIndex({ fieldName: 'createdAt' });

class Log {
  constructor(data) {
    this.adminEmail = data.adminEmail;
    this.action = data.action;
    this.details = data.details;

    // Standard Standalone Timestamps
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this._id = data._id || null;
  }

  /**
   * Optimized for SecurityLogs.jsx
   * Mimics: await Log.find().sort({ createdAt: -1 }).limit(100)
   */
  static async getLatestLogs(limit = 100) {
    const results = await db.find({}).sort({ createdAt: -1 }).limit(limit);
    return results.map(data => new Log(data));
  }

  // Mimics Mongoose: await Log.create({ adminEmail, action, details })
  static async create(data) {
    const logEntry = new Log(data);
    const doc = await db.insert({
      adminEmail: logEntry.adminEmail,
      action: logEntry.action,
      details: logEntry.details,
      createdAt: logEntry.createdAt,
      updatedAt: logEntry.updatedAt,
    });
    return new Log(doc);
  }

  // Mimics Mongoose: await Log.find(query)
  static async find(query = {}) {
    // Note: NeDB .find() returns a cursor, we chain .sort() if needed in the route
    const results = await db.find(query).sort({ createdAt: -1 });
    return results.map(data => new Log(data));
  }

  // Mimics Mongoose: await Log.findByIdAndDelete(id)
  static async findByIdAndDelete(id) {
    return await db.remove({ _id: id });
  }

  // Instance save method (standardized across your models)
  async save() {
    this.updatedAt = new Date();
    if (this._id) {
      await db.update({ _id: this._id }, { $set: this });
      return this;
    } else {
      const doc = await db.insert({
        adminEmail: this.adminEmail,
        action: this.action,
        details: this.details,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      });
      this._id = doc._id;
      return this;
    }
  }
}

module.exports = Log;
