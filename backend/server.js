// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes'); 
const bookCatalogRoutes = require('./routes/bookCatalog.routes');
const listRoutes = require('./routes/lists'); // <-- Add this for Students and Staff

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes); 
app.use('/api/bookCatalog', bookCatalogRoutes);
app.use('/api', listRoutes); // <-- This enables /api/students and /api/staff

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(5000, () => console.log('🚀 Backend running on http://localhost:5000'));
}).catch((err) => console.error('❌ MongoDB connection error:', err));