const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const routes = require('./routes');
const { initializeSocket } = require('./services/websocket');
const logger = require('./utils/logger');
const { readLimiter, generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://disaster-response-platform.vercel.app',
      'https://your-vercel-app.vercel.app',
      ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])
    ]
  : ['http://localhost:3000', 'http://localhost:3001'];

const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '')) || origin === allowed)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '')) || origin === allowed)) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-request-id', 'x-request-time']
}));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return readLimiter(req, res, next);
  }
  return generalLimiter(req, res, next);
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initializeSocket(io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Disaster Response Coordination Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

app.use('/api', routes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({ 
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: ['/health', '/api']
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 WebSocket server ready`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`🌐 Local server: http://localhost:${PORT}`);
    logger.info(`💊 Health check: http://localhost:${PORT}/health`);
  }
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = { app, server, io };
