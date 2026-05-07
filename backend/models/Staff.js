const Datastore = require('nedb-promises');
const path = require('path');
const { withoutEmptyId } = require('./utils');

// Storage: staff.db
const dbPath = path.join(process.env.DATA_DIR || __dirname, 'staff.db');
const db = Datastore.create({ filename: dbPath, autoload: true });

db.ensureIndex({ fieldName: 'name' });
db.ensureIndex({ fieldName: 'staffId' });

class Staff {
  constructor(data) {
    this.name = data.name || "";
    this.staffId = data.staffId || "";       // Stores STF-ID
    this.category = data.category || "Staff"; // Default matches your form logic
    this.subCategory = data.subCategory || null; // e.g., Teaching/Non-Teaching
    this.contact = data.contact || "";       // Stores Phone/Email
    this.department = data.department || "";
    this._id = data._id || null;
  }

  // Mimics Mongoose: await Staff.find(query)
  static async find(query = {}) {
    const results = await db.find(query);
    return results.map(data => new Staff(data));
  }

  // Mimics Mongoose: await Staff.findOne(query)
  static async findOne(query) {
    const data = await db.findOne(query);
    return data ? new Staff(data) : null;
  }

  // Mimics Mongoose: await Staff.findById(id)
  static async findById(id) {
    const data = await db.findOne({ _id: id });
    return data ? new Staff(data) : null;
  }

  // Mimics Mongoose: await Staff.create(data)
  static async create(data) {
    try {
      const staffMember = new Staff(data);
      const doc = await db.insert(withoutEmptyId(staffMember));
      return new Staff(doc);
    } catch (err) {
      if (err.errorType === 'uniqueViolated') {
        throw new Error('Staff member with this name already exists');
      }
      throw err;
    }
  }

  // Mimics Mongoose: await Staff.findByIdAndDelete(id)
  static async findByIdAndDelete(id) {
    return await db.remove({ _id: id });
  }

  // Instance .save() method
  async save() {
    try {
      if (this._id) {
        await db.update({ _id: this._id }, { $set: this });
        return this;
      } else {
        const doc = await db.insert(withoutEmptyId(this));
        this._id = doc._id;
        return this;
      }
    } catch (err) {
      if (err.errorType === 'uniqueViolated') {
        throw new Error('Staff name already exists');
      }
      throw err;
    }
  }
}

module.exports = Staff;
