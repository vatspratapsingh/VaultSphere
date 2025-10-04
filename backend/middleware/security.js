const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// General API rate limiter
const generalLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes (or from env)
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later'
);

// Strict rate limiter for auth endpoints
const authLimiter = createRateLimiter(
  process.env.TEST_MODE === 'true' 
    ? parseInt(process.env.TEST_RATE_LIMIT_WINDOW_MS) || 60000 // 1 minute for testing
    : parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes for production
  process.env.TEST_MODE === 'true'
    ? parseInt(process.env.TEST_AUTH_RATE_LIMIT_MAX) || 3 // 3 attempts for testing
    : parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // 5 attempts for production
  'Too many authentication attempts, please try again later'
);

// Very strict limiter for password reset
const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX) || 3, // limit each IP to 3 password reset attempts per hour
  'Too many password reset attempts, please try again later'
);

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 50
  maxDelayMs: 20000, // maximum delay of 20 seconds
});

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true, // X-Content-Type-Options: nosniff
  frameguard: { action: 'deny' }, // X-Frame-Options: DENY
  xssFilter: true, // X-XSS-Protection: 1; mode=block
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Additional security headers middleware
const additionalSecurityHeaders = (req, res, next) => {
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy (formerly Feature-Policy)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // X-Permitted-Cross-Domain-Policies
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // X-Download-Options
  res.setHeader('X-Download-Options', 'noopen');
  
  next();
};

// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured, allow all
    }
    
    if (allowedIPs.includes(clientIP)) {
      return next();
    }
    
    console.warn(`Blocked request from unauthorized IP: ${clientIP}`);
    return res.status(403).json({
      error: 'Access denied from this IP address'
    });
  };
};

// Request sanitization
const sanitizeInput = (req, res, next) => {
  // Remove potentially dangerous characters from request body
  if (req.body) {
    const sanitize = (obj) => {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          // Remove script tags and other potentially dangerous content
          obj[key] = obj[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
};

// Setup function to apply all security middleware
const setupSecurityMiddleware = (app) => {
  // Apply security headers
  app.use(securityHeaders);
  app.use(additionalSecurityHeaders);
  
  // Apply input sanitization
  app.use(sanitizeInput);
  
  // Apply general rate limiting
  app.use(generalLimiter);
  
  // Apply speed limiting
  app.use(speedLimiter);
};

// Rate limiters object for easy access
const rateLimiters = {
  general: generalLimiter,
  auth: authLimiter,
  passwordReset: passwordResetLimiter,
  speed: speedLimiter
};

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  speedLimiter,
  securityHeaders,
  additionalSecurityHeaders,
  ipWhitelist,
  sanitizeInput,
  setupSecurityMiddleware,
  rateLimiters
};