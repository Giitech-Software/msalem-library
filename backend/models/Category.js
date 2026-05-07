const Datastore = require('nedb-promises');
const path = require('path');
const { withoutEmptyId } = require('./utils');

// Storage: categories.db
const dbPath = path.join(process.env.DATA_DIR || __dirname, 'categories.db');
const db = Datastore.create({ filename: dbPath, autoload: true });

// Mimic unique: true constraint for names
db.ensureIndex({ fieldName: 'name', unique: true });

class Category {
  constructor(data) {
    this.name = data.name || "";
    this.subCategories = data.subCategories || [];
    this._id = data._id || null;
  }

  // Mimics Mongoose: await Category.find()
  static async find(query = {}) {
    const results = await db.find(query);
    return results.map(data => new Category(data));
  }

  // Mimics Mongoose: await Category.findOne({ name: '...' })
  static async findOne(query) {
    const data = await db.findOne(query);
    return data ? new Category(data) : null;
  }

  // Mimics Mongoose: await Category.findById(id)
  static async findById(id) {
    const data = await db.findOne({ _id: id });
    return data ? new Category(data) : null;
  }

  // Mimics Mongoose: await Category.create({ name: 'Science', subCategories: ['Physics'] })
  static async create(data) {
    try {
      const category = new Category(data);
      const doc = await db.insert(withoutEmptyId(category));
      return new Category(doc);
    } catch (err) {
      if (err.errorType === 'uniqueViolated') {
        throw new Error('Category name already exists');
      }
      throw err;
    }
  }

  // Mimics Mongoose: await Category.findByIdAndDelete(id)
  static async findByIdAndDelete(id) {
    return await db.remove({ _id: id });
  }

  // Mimics Mongoose instance .save()
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
        throw new Error('Category name already exists');
      }
      throw err;
    }
  }
}

module.exports = Category;
