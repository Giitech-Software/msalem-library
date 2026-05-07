const Datastore = require('nedb-promises');
const path = require('path');
const { withoutEmptyId } = require('./utils');

// Storage: students.db
const dbPath = path.join(process.env.DATA_DIR || __dirname, 'students.db');
const db = Datastore.create({ filename: dbPath, autoload: true });

db.ensureIndex({ fieldName: 'name' });
db.ensureIndex({ fieldName: 'studentId' });

class Student {
  constructor(data) {
    this.name = data.name || "";
    this.studentId = data.studentId || ""; // Stores STD-ID
    this.category = data.category || null; 
    this.subCategory = data.subCategory || null;
    this.contact = data.contact || "";      // Stores Phone/Email
    this._id = data._id || null;
  }

  // Mimics Mongoose: await Student.find(query)
  static async find(query = {}) {
    const results = await db.find(query);
    return results.map(data => new Student(data));
  }

  // Mimics Mongoose: await Student.findOne({ name: '...' })
  static async findOne(query) {
    const data = await db.findOne(query);
    return data ? new Student(data) : null;
  }

  // Mimics Mongoose: await Student.findById(id)
  static async findById(id) {
    const data = await db.findOne({ _id: id });
    return data ? new Student(data) : null;
  }

  // Mimics Mongoose: await Student.create(data)
  static async create(data) {
    try {
      const student = new Student(data);
      const doc = await db.insert(withoutEmptyId(student));
      return new Student(doc);
    } catch (err) {
      if (err.errorType === 'uniqueViolated') {
        throw new Error('Student name already exists in the system');
      }
      throw err;
    }
  }

  // Mimics Mongoose: await Student.findByIdAndDelete(id)
  static async findByIdAndDelete(id) {
    return await db.remove({ _id: id });
  }

  // Instance .save() method for updates or manual creation
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
        throw new Error('Student name already exists');
      }
      throw err;
    }
  }
}

module.exports = Student;
