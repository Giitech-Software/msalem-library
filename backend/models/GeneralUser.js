const Datastore = require('nedb-promises');
const path = require('path');
const { withoutEmptyId } = require('./utils');

// Storage: general_users.db
const dbPath = path.join(process.env.DATA_DIR || __dirname, 'general_users.db');
const db = Datastore.create({ filename: dbPath, autoload: true });

db.ensureIndex({ fieldName: 'name' });
db.ensureIndex({ fieldName: 'borrowerId' });

class GeneralUser {
  constructor(data) {
    this.name = data.name || "";
    this.borrowerId = data.borrowerId || "";      // Stores GNR-ID
    this.category = data.category || "General User";
    this.subCategory = data.subCategory || null; 
    this.contact = data.contact || "";           // Stores Phone/Email
    this._id = data._id || null;
  }

  // Mimics Mongoose: await GeneralUser.find(query)
  static async find(query = {}) {
    const results = await db.find(query);
    return results.map(data => new GeneralUser(data));
  }

  // Mimics Mongoose: await GeneralUser.findOne(query)
  static async findOne(query) {
    const data = await db.findOne(query);
    return data ? new GeneralUser(data) : null;
  }

  // Mimics Mongoose: await GeneralUser.findById(id)
  static async findById(id) {
    const data = await db.findOne({ _id: id });
    return data ? new GeneralUser(data) : null;
  }

  // Mimics Mongoose: await GeneralUser.create(data)
  static async create(data) {
    try {
      const gUser = new GeneralUser(data);
      const doc = await db.insert(withoutEmptyId(gUser));
      return new GeneralUser(doc);
    } catch (err) {
      if (err.errorType === 'uniqueViolated') {
        throw new Error('General user with this name already exists');
      }
      throw err;
    }
  }

  // Mimics Mongoose: await GeneralUser.findByIdAndDelete(id)
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
        throw new Error('General user name already exists');
      }
      throw err;
    }
  }
}

module.exports = GeneralUser;
