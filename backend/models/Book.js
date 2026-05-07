const Datastore = require('nedb-promises');
const path = require('path');
const { withoutEmptyId } = require('./utils');

// Storage: books.db
const dbPath = path.join(process.env.DATA_DIR || __dirname, 'books.db');
const db = Datastore.create({ filename: dbPath, autoload: true });

// --- Standalone Indices ---
// NeDB uses ensureIndex to keep searches fast for your reports
db.ensureIndex({ fieldName: 'borrowerId' });
db.ensureIndex({ fieldName: 'returned' });
db.ensureIndex({ fieldName: 'bookType' });

class Book {
  constructor(data) {
    const borrowedDate = data.borrowedDate ? new Date(data.borrowedDate) : new Date();
    const returnDate = data.returnDate ? new Date(data.returnDate) : null;
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();

    // Core Fields
    this.title = data.title;
    this.borrowerName = data.borrowerName;
    this.borrowerId = data.borrowerId;
    this.category = data.category;
    this.subCategory = data.subCategory;
    this.borrowedDate = borrowedDate;
    this.returnDate = returnDate;
    this.contact = data.contact || "";
    this.returned = data.returned !== undefined ? data.returned : false;
    this.status = data.status || (this.returned ? "Returned" : "Borrowed");

    // Enterprise & Digital Fields
    this.bookType = data.bookType || "Physical";
    this.pdfUrl = data.pdfUrl || null;
    this.borrowingCost = Number(data.borrowingCost) || 0;
    this.dispatchStatus = data.dispatchStatus || "N/A";

    // Timestamps
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this._id = data._id || null;
  }

  // Mimics Mongoose: await Book.find(query)
  static async find(query = {}) {
    const results = await db.find(query);
    return results.map(data => new Book(data));
  }

  // Mimics Mongoose: await Book.findOne(query)
  static async findOne(query) {
    const data = await db.findOne(query);
    return data ? new Book(data) : null;
  }

  // Mimics Mongoose: await Book.findById(id)
  static async findById(id) {
    const data = await db.findOne({ _id: id });
    return data ? new Book(data) : null;
  }

  // Mimics Mongoose: await Book.findByIdAndDelete(id)
  static async findByIdAndDelete(id) {
    return await db.remove({ _id: id });
  }

  // Mimics Mongoose: await Book.countDocuments(query)
  static async countDocuments(query = {}) {
    return await db.count(query);
  }

  // Mimics Mongoose: await Book.create(data)
  static async create(data) {
    const book = new Book(data);
    const doc = await db.insert(withoutEmptyId(book));
    return new Book(doc);
  }

  // Mimics Mongoose instance .save()
  async save() {
    this.updatedAt = new Date(); // Update the timestamp on every save
    
    if (this._id) {
      await db.update({ _id: this._id }, { $set: this });
      return this;
    } else {
      const doc = await db.insert(withoutEmptyId(this));
      this._id = doc._id;
      return this;
    }
  }

  // Useful for Statistics.jsx: find by date range
  static async findByDateRange(start, end) {
    return await db.find({
      borrowedDate: { $gte: start, $lte: end }
    });
  }
}

module.exports = Book;
