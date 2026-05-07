// backend/models/Admin.js
const Datastore = require('nedb-promises');
const path = require('path');
const bcrypt = require('bcryptjs');

// Create the database file in the production-safe data directory
const dbPath = path.join(process.env.DATA_DIR || __dirname, 'admins.db');
const db = Datastore.create({ filename: dbPath, autoload: true });

class Admin {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || "admin";
    this.status = data.status || "active";
    this._id = data._id || null;
  }

  get id() {
    return this._id;
  }

  // Mimics Mongoose: const admin = await Admin.findOne({ email })
  static async findOne(query) {
    if (query.email) {
      query = { ...query, email: query.email.trim().toLowerCase() };
    }
    const data = await db.findOne(query);
    return data ? new Admin(data) : null;
  }

  // Mimics Mongoose: const admins = await Admin.find()
  static async find(query = {}) {
    const results = await db.find(query);
    return results.map(data => new Admin(data));
  }

  // Mimics Mongoose: await Admin.findById(id)
  static async findById(id) {
    const data = await db.findOne({ _id: id });
    return data ? new Admin(data) : null;
  }

  // Mimics Mongoose: await Admin.findByIdAndDelete(id)
  static async findByIdAndDelete(id) {
    return await db.remove({ _id: id });
  }

  // Mimics Mongoose: admin.comparePassword(password)
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Mimics Mongoose: await newAdmin.save()
  async save() {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }

    // 1. Handle Password Hashing
    // Check for common bcrypt prefixes: $2a$, $2b$, or $2y$
    const isAlreadyHashed = /^\$2[ayb]\$/.test(this.password);

    if (this.password && !isAlreadyHashed) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    if (this._id) {
      // Update existing
      await db.update({ _id: this._id }, { $set: this });
      return this;
    } else {
      // Create new
      const doc = {
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.role,
        status: this.status,
      };

      if (!doc.name) delete doc.name;

      const inserted = await db.insert(doc);
      this._id = inserted._id;
      return this;
    }
  }

  // Helper to mimic Mongoose's .select('-password') in your routes
  // Usage: const filtered = admin.toPublic()
  toPublic() {
    const { password, ...publicData } = this;
    return publicData;
  }
}

// Add a helper for the 'Log.create' style calls if you use them
Admin.create = async (data) => {
  const admin = new Admin(data);
  return await admin.save();
};

Admin.update = async (id, data) => {
  const update = { ...data };

  if (update.email) {
    update.email = update.email.trim().toLowerCase();
  }

  if (update.password && !/^\$2[ayb]\$/.test(update.password)) {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(update.password, salt);
  }

  await db.update({ _id: id }, { $set: update });
  const updated = await db.findOne({ _id: id });
  return updated ? new Admin(updated) : null;
};

module.exports = Admin;
