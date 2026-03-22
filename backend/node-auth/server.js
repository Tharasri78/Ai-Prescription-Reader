const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');

// Load env vars
dotenv.config();

// Connect DB
const connectDB = require('./config/db');
connectDB();

// Routes
const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');

const app = express();

/* =====================================================
   ✅ CORS (MUST BE FIRST)
===================================================== */
const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-prescription-reader.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // mobile / postman

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// 🔥 Handle preflight (IMPORTANT)
app.options('*', cors());


/* =====================================================
   ✅ BODY PARSER
===================================================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/* =====================================================
   ✅ FILE UPLOAD (FIXED FOR RENDER)
===================================================== */
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',   // 🔥 REQUIRED for Render
  limits: { fileSize: 2 * 1024 * 1024 }, // 🔥 2MB max
  abortOnLimit: true
}));


/* =====================================================
   ✅ ROUTES
===================================================== */
app.use('/auth', authRoutes);
app.use('/scan', scanRoutes);


/* =====================================================
   ✅ HEALTH CHECK
===================================================== */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
    pythonAI: process.env.PYTHON_AI_URL
  });
});


/* =====================================================
   ✅ ROOT
===================================================== */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MediScan API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login'
      },
      scan: {
        prescription: 'POST /scan/prescription',
        history: 'GET /scan/history'
      }
    }
  });
});


/* =====================================================
   ✅ ERROR HANDLER
===================================================== */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  // File too large
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: "File too large (max 2MB)"
    });
  }

  // CORS error
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS blocked request"
    });
  }

  res.status(500).json({
    success: false,
    message: "Server error"
  });
});


/* =====================================================
   ✅ 404
===================================================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});


/* =====================================================
   ✅ START SERVER
===================================================== */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 MediScan Server Running
=========================
🌍 Port: ${PORT}
⚙️ Env: ${process.env.NODE_ENV}
🤖 AI URL: ${process.env.PYTHON_AI_URL}
  `);
});


/* =====================================================
   ✅ UNHANDLED ERRORS
===================================================== */
process.on('unhandledRejection', (err) => {
  console.log("❌ Unhandled Error:", err.message);
  server.close(() => process.exit(1));
});