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
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.options('*', cors());

/* =====================================================
   ✅ BODY PARSER
===================================================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   🔥 FILE UPLOAD (FINAL FIX)
===================================================== */
app.use(fileUpload({
  useTempFiles: false,   // 🔥 THIS FIXES YOUR ISSUE
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
// 🔥 ADD THIS (HEAD support)
app.head('/health', (req, res) => {
  res.status(200).end();
});

/* =====================================================
   ✅ ROOT
===================================================== */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MediScan API',
    version: '1.0.0'
  });
});

/* =====================================================
   ✅ ERROR HANDLER
===================================================== */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: "File too large (max 5MB)"
    });
  }

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