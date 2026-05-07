const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

require('dotenv').config({
  path: path.join(__dirname, '.env')
});

// ---------------------------------------------------------------------------
// 📂 STANDALONE DATA PATH CONFIGURATION
// ---------------------------------------------------------------------------
/**
 * In Production, Electron sets process.env.DATA_DIR.
 * If not set (Development), we use a 'data' folder in the backend directory.
 */
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
process.env.DATA_DIR = dataDir; // Ensure models can see this

// Ensure the data and uploads directory exists
const uploadDir = path.join(dataDir, 'uploads', 'pdfs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

console.log(`[Database] Storing data in: ${dataDir}`);

// ---------------------------------------------------------------------------
// 🚀 APP INITIALIZATION
// ---------------------------------------------------------------------------
const authRoutes         = require('./routes/auth.routes');
const bookRoutes         = require('./routes/book.routes');
const bookCatalogRoutes  = require('./routes/bookCatalog.routes');
const listRoutes         = require('./routes/lists');
const bootstrapAdmin     = require('./bootstrapAdmin');

const app = express();
const PORT = process.env.PORT || 5000;
let server;

// Serve uploads as static
app.use('/uploads', express.static(path.join(dataDir, 'uploads')));

// CORS - configured for Electron and Dev
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

  if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---------------------------------------------------------------------------
// 🏥 HEALTH CHECK (Updated for Standalone)
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  // Since we use NeDB, the "database" is just the file system.
  // If the server is running, the database is considered "connected".
  res.status(200).json({
    ok: true,
    server: 'running',
    database: 'standalone-nedb',
    storagePath: dataDir
  });
});

app.use('/api/auth',        authRoutes);
app.use('/api/books',       bookRoutes);
app.use('/api/bookCatalog', bookCatalogRoutes);
app.use('/api',             listRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'API Route not found' });
});

// ---------------------------------------------------------------------------
// ⚡ SERVER START (MongoDB logic removed)
// ---------------------------------------------------------------------------
function startServer() {
  if (server) return;

  server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ Standalone Backend running on http://127.0.0.1:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Backend server error:', err.message);
    process.exit(1);
  });
}

bootstrapAdmin()
  .catch((err) => {
    console.error('[Admin Bootstrap] Failed:', err.message);
  })
  .finally(startServer);

process.on('SIGTERM', () => {
  console.log('Closing backend server...');
  process.exit(0);
});
