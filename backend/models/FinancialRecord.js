const Datastore = require('nedb-promises');
const path = require('path');
const { withoutEmptyId } = require('./utils');

// Storage: financial_records.db
const dbPath = path.join(process.env.DATA_DIR || __dirname, 'financial_records.db');
const db = Datastore.create({ filename: dbPath, autoload: true });

// Indexing date for faster financial reporting
db.ensureIndex({ fieldName: 'date' });

class FinancialRecord {
  constructor(data) {
    this.title = data.title;
    this.borrowerName = data.borrowerName;
    this.borrowerId = data.borrowerId || null;
    this.bookType = data.bookType || "Physical";
    this.amount = typeof data.amount === 'number' ? data.amount : 0;
    this.date = data.date || new Date();
    this.issuedBy = data.issuedBy || "System";
    this.isOrphaned = data.isOrphaned !== undefined ? data.isOrphaned : false;

    // Timestamps
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this._id = data._id || null;
  }

  // Mimics Mongoose: await FinancialRecord.find()
  static async find(query = {}) {
    const results = await db.find(query);
    return results.map(data => new FinancialRecord(data));
  }

  // Optimized for SuperAdminFinance.jsx (Newest records first)
  // Mimics: await FinancialRecord.find().sort({ date: -1 })
  static async findSorted(query = {}, sort = { date: -1 }) {
    const results = await db.find(query).sort(sort);
    return results.map(data => new FinancialRecord(data));
  }

  static async findOne(query) {
    const data = await db.findOne(query);
    return data ? new FinancialRecord(data) : null;
  }

  static async findById(id) {
    const data = await db.findOne({ _id: id });
    return data ? new FinancialRecord(data) : null;
  }

  // Mimics Mongoose: await FinancialRecord.create(data)
  static async create(data) {
    const record = new FinancialRecord(data);
    const doc = await db.insert(withoutEmptyId(record));
    return new FinancialRecord(doc);
  }

  // Helper for Statistics: Calculate total revenue
  static async getRevenueTotal() {
    const records = await db.find({});
    return records.reduce((sum, record) => sum + record.amount, 0);
  }

  // Mimics Mongoose instance .save()
  async save() {
    this.updatedAt = new Date();
    if (this._id) {
      await db.update({ _id: this._id }, { $set: this });
      return this;
    } else {
      const doc = await db.insert(withoutEmptyId(this));
      this._id = doc._id;
      return this;
    }
  }
}

module.exports = FinancialRecord;
