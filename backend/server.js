const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load .env from the current directory (works in dev and packaged resources)
require('dotenv').config({ 
  path: path.join(__dirname, '.env') 
});

const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes'); 
const bookCatalogRoutes = require('./routes/bookCatalog.routes');
const listRoutes = require('./routes/lists'); 

const app = express();

// CORS configuration for both Dev (Vite) and Production (file://)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

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
    serverSelectionTimeoutMS: 5000, // Wait 5 seconds before failing
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
    console.log('👉 Ensure your local MongoDB service is running (mongod).');
    
    // In an Electron context, we exit so the main process knows the backend failed
    process.exit(1); 
  });
};

// Start the connection process
connectWithRetry();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
});