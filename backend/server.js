// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

require('dotenv').config({
  path: path.join(__dirname, '.env')
});

const authRoutes        = require('./routes/auth.routes');
const bookRoutes        = require('./routes/book.routes');
const bookCatalogRoutes = require('./routes/bookCatalog.routes');
const listRoutes        = require('./routes/lists');

const app = express();

// Ensure uploads/pdfs directory exists
const uploadDir = path.join(__dirname, 'uploads', 'pdfs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploads as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------------------------------------------------------------
// CORS — wide open for local/desktop app use
// Electron renderer sends origin: null or no origin at all
// We trust all requests since this backend only binds to 127.0.0.1 anyway
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow dev origins explicitly, allow null/missing origin (Electron production)
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Increased limits to handle PDF file data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth',        authRoutes);
app.use('/api/books',       bookRoutes);
app.use('/api/bookCatalog', bookCatalogRoutes);
app.use('/api',             listRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'API Route not found' });
});

// ---------------------------------------------------------------------------
// MongoDB Connection
// ---------------------------------------------------------------------------
const mongoURI = process.env.MONGO_URI
  ? process.env.MONGO_URI.replace('localhost', '127.0.0.1')
  : 'mongodb://127.0.0.1:27017/msalem_library';

const connectWithRetry = () => {
  console.log('Attempting to connect to MongoDB...');

  mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`Backend running on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
};

connectWithRetry();

process.on('SIGTERM', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});
