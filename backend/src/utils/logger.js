const winston = require('winston');

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { 
    service: 'disaster-response-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: []
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
} else {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));
}

if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 10485760,
    maxFiles: 5,
    tailable: true
  }));

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 10485760,
    maxFiles: 5,
    tailable: true
  }));
}

logger.disaster = (action, disasterId, details = {}) => {
  logger.info('Disaster action', {
    context: 'disaster',
    action,
    disasterId,
    ...details
  });
};

logger.api = (method, endpoint, statusCode, responseTime, details = {}) => {
  logger.info('API request', {
    context: 'api',
    method,
    endpoint,
    statusCode,
    responseTime: `${responseTime}ms`,
    ...details
  });
};

logger.auth = (action, userId, details = {}) => {
  logger.info('Auth action', {
    context: 'auth',
    action,
    userId,
    ...details
  });
};

logger.external = (service, action, success, details = {}) => {
  logger.info('External service call', {
    context: 'external',
    service,
    action,
    success,
    ...details
  });
};

logger.cache = (action, key, hit = null, details = {}) => {
  logger.debug('Cache operation', {
    context: 'cache',
    action,
    key,
    hit,
    ...details
  });
};

logger.websocket = (event, clientId, details = {}) => {
  logger.debug('WebSocket event', {
    context: 'websocket',
    event,
    clientId,
    ...details
  });
};

logger.requestMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.api(
      req.method,
      req.originalUrl,
      res.statusCode,
      duration,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
      }
    );
  });
  
  next();
};

logger.logError = (error, context = {}) => {
  logger.error('Application error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
};

logger.logPerformance = (operation, duration, details = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger[level]('Performance metric', {
    operation,
    duration: `${duration}ms`,
    ...details
  });
};

module.exports = logger;
