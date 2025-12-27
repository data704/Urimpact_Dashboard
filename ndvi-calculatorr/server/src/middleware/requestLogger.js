// Request Logger Middleware
// Logs all HTTP requests with method, path, status, and duration
// Production-ready logging

/**
 * Request logger middleware
 * Logs request method, path, status code, and response time
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
export const requestLogger = (req, res, next) => {
  // Skip health check endpoint to reduce log noise
  if (req.path === '/api/health') {
    return next();
  }

  const startTime = Date.now();

  // Log request start
  if (process.env.ENABLE_REQUEST_LOGGING === 'true' || process.env.NODE_ENV === 'development') {
    console.log(`📥 ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Log response
    if (process.env.ENABLE_REQUEST_LOGGING === 'true' || process.env.NODE_ENV === 'development') {
      const logLevel = res.statusCode >= 400 ? '❌' : '✅';
      console.log(`${logLevel} ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    }

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

export default requestLogger;

