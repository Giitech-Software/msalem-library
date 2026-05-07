const Datastore = require('nedb-promises');
const path = require('path');
const { withoutEmptyId } = require('./utils');

// Storage: book_catalog.db
const dbPath = path.join(process.env.DATA_DIR || __dirname, 'book_catalog.db');
const db = Datastore.create({ filename: dbPath, autoload: true });

// Indexing title for faster lookups
db.ensureIndex({ fieldName: 'title' });

class BookCatalog {
  constructor(data) {
    this.title = data.title || "";
    this.author = data.author || "";
    this.category = data.category || "General";
    this.totalQuantity = data.totalQuantity !== undefined ? data.totalQuantity : 1;
    
    // 🚀 Standalone Enterprise Fields
    this.bookType = data.bookType || "Physical";
    this.pdfUrl = data.pdfUrl || null;
    this.basePrice = data.basePrice || 0;

    this.isbn = data.isbn || "";
    this.publishedYear = data.publishedYear || "";
    this.description = data.description || "";

    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this._id = data._id || null;
  }

  // Mimics Mongoose: await BookCatalog.find(query)
  static async find(query = {}) {
    const results = await db.find(query);
    return results.map(data => new BookCatalog(data));
  }

  // REPLACES MongoDB Text Index: Search by title or author
  // Usage: await BookCatalog.search("Science")
  static async search(term) {
    const regex = new RegExp(term, 'i'); // Case-insensitive search
    const results = await db.find({
      $or: [
        { title: regex },
        { author: regex },
        { isbn: regex }
      ]
    });
    return results.map(data => new BookCatalog(data));
  }

  static async findOne(query) {
    const data = await db.findOne(query);
    return data ? new BookCatalog(data) : null;
  }

  static async findById(id) {
    const data = await db.findOne({ _id: id });
    return data ? new BookCatalog(data) : null;
  }

  static async findByIdAndUpdate(id, update) {
    update.updatedAt = new Date();
    await db.update({ _id: id }, { $set: update });
    const data = await db.findOne({ _id: id });
    return data ? new BookCatalog(data) : null;
  }

  static async findByIdAndDelete(id) {
    return await db.remove({ _id: id });
  }

  static async create(data) {
    const catalog = new BookCatalog(data);
    const doc = await db.insert(withoutEmptyId(catalog));
    return new BookCatalog(doc);
  }

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

module.exports = BookCatalog;
