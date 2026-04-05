//backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // ✅ Added for directory checking

// Load .env from the current directory
require('dotenv').config({ 
  path: path.join(__dirname, '.env') 
});

const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes'); 
const bookCatalogRoutes = require('./routes/bookCatalog.routes');
const listRoutes = require('./routes/lists'); 

const app = express();

// ✅ NEW: Ensure 'uploads/pdfs' directory exists so the server doesn't crash on first upload
const uploadDir = path.join(__dirname, 'uploads/pdfs');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ NEW: Serve the 'uploads' folder as static so PDF links work
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// ✅ UPDATE: Increased limits to handle PDF file strings/data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes); 
app.use('/api/bookCatalog', bookCatalogRoutes);
app.use('/api', listRoutes); 

// Handle 404s for API routes
app.use((req, res) => {
  res.status(404).json({ message: "API Route not found" });
});

// --- MongoDB Connection Logic ---
const mongoURI = process.env.MONGO_URI 
  ? process.env.MONGO_URI.replace('localhost', '127.0.0.1') 
  : 'mongodb://127.0.0.1:27017/msalem_library';

const connectWithRetry = () => {
  console.log('⏳ Attempting to connect to MongoDB...');
  
  mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Backend running on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
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