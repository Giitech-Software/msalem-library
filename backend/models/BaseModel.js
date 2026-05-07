const Datastore = require('nedb-promises');
const path = require('path');

class BaseModel {
  constructor(fileName) {
    const dbPath = path.join(process.env.DATA_DIR, fileName);
    this.db = Datastore.create({ filename: dbPath, autoload: true });
  }

  async find(query = {}) {
    return await this.db.find(query);
  }

  async findOne(query = {}) {
    return await this.db.findOne(query);
  }

  async findById(id) {
    return await this.db.findOne({ _id: id });
  }

  async create(data) {
    data.createdAt = new Date();
    return await this.db.insert(data);
  }

  async findByIdAndUpdate(id, update) {
    // Mimics Mongoose { new: true }
    await this.db.update({ _id: id }, { $set: update });
    return await this.db.findOne({ _id: id });
  }

  async findByIdAndDelete(id) {
    return await this.db.remove({ _id: id });
  }

  // Support for sorting (used in your Logs/Financials)
  async findSorted(query = {}, sort = { createdAt: -1 }, limit = null) {
    let cursor = this.db.find(query).sort(sort);
    if (limit) cursor = cursor.limit(limit);
    return await cursor;
  }
}

module.exports = BaseModel;