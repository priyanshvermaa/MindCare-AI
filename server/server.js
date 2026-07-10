import './config/env.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import {
  register,
  login,
  forgotPassword,
  resetPassword
} from './controllers/authController.js';
import { protect, authorizeRoles } from './middleware/authMiddleware.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import meditationRoutes from './routes/meditationRoutes.js';
import meditationModuleRoutes from './routes/meditationModuleRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import userRoutes from './routes/userRoutes.js';
import passport from 'passport';
import './config/passport.js';
import oauthRoutes from './routes/oauthRoutes.js';
import waterRoutes from './routes/waterRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';

import { seedInitialData } from './utils/seeder.js';

// Set up global crash logging
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', err.stack || err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...', err.stack || err);
  process.exit(1);
});

// Server started log
console.log('🚀 Server started (Initialization phase)');

// Load environment variables using absolute path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Verify that critical environment variables are loaded successfully
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'GROQ_API_KEY'
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing environment variable: ${envVar}`);
  } else {
    console.log(`✅ ${envVar} loaded successfully.`);
  }
});

// Connect to Database
connectDB().then(() => {
  seedInitialData();
});

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "https://mind-care-bnb7by6ni-pv8111142-8272s-projects.vercel.app/",
      "https://mind-care-bnb7by6ni-pv8111142-8272s-projects.vercel.app"
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Blocked by CORS policy"));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(passport.initialize());

// Logger middleware for testing
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Mount routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meditations', meditationRoutes);
app.use('/api/meditation', meditationModuleRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/badges', badgeRoutes);

// Authentication Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);
app.use('/api/auth', oauthRoutes);

// Routes registered log
console.log('🛣️ Routes registered');

// Protected Test Profile Route
app.get('/api/auth/me', protect, (req, res) => {
  const user = req.user;
  const userResponse = {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || '',
    profilePicture: user.profilePicture || user.avatar || '',
    age: user.age,
    recommendedSleep: user.recommendedSleep,
    profileCompleted: user.profileCompleted,
    onboardingCompleted: user.onboardingCompleted,
    height: user.height,
    weight: user.weight,
    activityLevel: user.activityLevel,
    wellnessGoal: user.wellnessGoal,
    authMethod: user.authMethod,
    tokenVersion: user.tokenVersion,
  };

  if (!user.onboardingCompleted && (user.age === null || user.age === undefined)) {
    userResponse.onboardingRequired = true;
  }

  res.status(200).json({
    success: true,
    user: userResponse,
  });
});

// Role-based verification demo endpoints
app.get(
  '/api/auth/employee-dashboard',
  protect,
  authorizeRoles('user', 'employee', 'admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Access granted to Employee dashboard data.',
    });
  }
);

app.get(
  '/api/auth/practitioner-dashboard',
  protect,
  authorizeRoles('practitioner', 'admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Access granted to Practitioner dashboard data.',
    });
  }
);

app.get(
  '/api/auth/admin-dashboard',
  protect,
  authorizeRoles('admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Access granted to Administrator dashboard data.',
    });
  }
);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error: ', err.stack);
  res.status(500).json({
    message: err.message || 'An internal server error occurred.',
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Port listening on http://127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
  console.error('💥 SERVER ERROR (full stack trace):', err.stack || err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }
});