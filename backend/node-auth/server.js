const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = require('./config/db');
connectDB();

// Route files
const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload
app.use(fileUpload({
  useTempFiles: false,
  tempFileDir: path.join(__dirname, 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  createParentPath: true,
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded (max 5MB)'
}));

// Enable CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ai-prescription-reader.vercel.app"
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Mount routers
app.use('/auth', authRoutes);
app.use('/scan', scanRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    pythonAI: process.env.PYTHON_AI_URL
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MediScan Auth API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        me: 'GET /auth/me',
        update: 'PUT /auth/update',
        logout: 'POST /auth/logout',
        verifyToken: 'POST /auth/verify-token'
      },
      scan: {
        prescription: 'POST /scan/prescription',
        history: 'GET /scan/history'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  if (err.code === 'FILE_LIMIT') {
    return res.status(400).json({
      success: false,
      message: err.message || 'File too large'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.url} not found`
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  🚀 MediScan Auth Server
  ========================
  📡 Port: ${PORT}
  🔧 Environment: ${process.env.NODE_ENV || 'development'}
  📊 MongoDB: ${process.env.MONGO_URL}
  🤖 Python AI: ${process.env.PYTHON_AI_URL}
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});