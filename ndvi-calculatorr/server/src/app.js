// src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import ndviRoutes from './routes/ndviRoutes.js';
import mhiRoutes from './routes/mhiRoutes.js';
import agcRoutes from './routes/agcRoutes.js';
import socRoutes from './routes/socRoutes.js';
import baselineRoutes from './routes/baselineRoutes.js';
import majmaahRoutes from './routes/majmaahRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { initEarthEngine } from './services/earthEngineService.js';
import { testConnection, initializeDatabase } from './config/database.js';
import { initializeSecrets } from './config/secrets.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(requestLogger);
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl or mobile apps)
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      
      // Log blocked CORS requests
      console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow credentials for JWT tokens
  })
);

// Health check endpoint (before other routes)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// ROUTES
// ============================================
app.use('/api', ndviRoutes);
app.use('/api', mhiRoutes);
app.use('/api', agcRoutes);
app.use('/api', socRoutes);
app.use('/api', baselineRoutes);
app.use('/api', majmaahRoutes);
app.use('/api', userRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// ============================================
// SERVER INITIALIZATION
// ============================================
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🚀 Starting NDVI Calculator Backend with Majmaah Integration...');
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);

    // 1. Initialize secrets (AWS Secrets Manager in production)
    await initializeSecrets();

    // 2. Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // 3. Initialize database schema
    await initializeDatabase();

    // 4. Initialize Google Earth Engine
    await initEarthEngine();

    // 5. Start server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📊 NDVI Calculator API: http://localhost:${PORT}/api`);
      console.log(`🌳 Majmaah Dashboard API: http://localhost:${PORT}/api/majmaah`);
      console.log(`👤 Admin Controls API: http://localhost:${PORT}/api/admin`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();