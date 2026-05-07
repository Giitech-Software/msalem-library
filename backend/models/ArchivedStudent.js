const Datastore = require('nedb-promises');
const path = require('path');
const { withoutEmptyId } = require('./utils');

// Storage: archived_students.db
const dbPath = path.join(process.env.DATA_DIR || __dirname, 'archived_students.db');
const db = Datastore.create({ filename: dbPath, autoload: true });

class ArchivedStudent {
  constructor(data) {
    this.name = data.name;
    this.category = data.category;
    this.subCategory = data.subCategory;
    // Mimics Mongoose default: Date.now
    this.graduationDate = data.graduationDate || new Date();
    this._id = data._id || null;
  }

  // Mimics Mongoose: await ArchivedStudent.find(query)
  static async find(query = {}) {
    const results = await db.find(query);
    return results.map(data => new ArchivedStudent(data));
  }

  // Mimics Mongoose: await ArchivedStudent.findOne(query)
  static async findOne(query) {
    const data = await db.findOne(query);
    return data ? new ArchivedStudent(data) : null;
  }

  // Mimics Mongoose: await ArchivedStudent.create(data)
  static async create(data) {
    const student = new ArchivedStudent(data);
    const doc = await db.insert(withoutEmptyId(student));
    return new ArchivedStudent(doc);
  }

  // Mimics Mongoose instance .save()
  async save() {
    if (this._id) {
      await db.update({ _id: this._id }, { $set: this });
      return this;
    } else {
      const doc = await db.insert(withoutEmptyId(this));
      this._id = doc._id;
      return this;
    }
  }

  // Helper for sorting (Useful for archives)
  // Usage: await ArchivedStudent.findSorted({ category: 'SHS' }, { graduationDate: -1 })
  static async findSorted(query = {}, sort = { graduationDate: -1 }) {
    const results = await db.find(query).sort(sort);
    return results.map(data => new ArchivedStudent(data));
  }
}

module.exports = ArchivedStudent;
