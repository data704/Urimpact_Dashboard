// Authentication Middleware
import { verifyToken } from '../services/userService.js';

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    // For development, allow requests without token (will be filtered by user_id = null)
    req.user = null;
    return next();
  }
  
  // In development, allow demo tokens and invalid tokens (treat as unauthenticated)
  const isDevelopment = process.env.NODE_ENV !== 'production';
  if (isDevelopment && (token === 'demo-token' || token === 'demo_token')) {
    req.user = null; // Treat demo token as unauthenticated but allow request
    return next();
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    // In development, allow invalid tokens (treat as unauthenticated)
    if (isDevelopment) {
      req.user = null;
      return next();
    }
    
    // In production, reject invalid tokens
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
  
  req.user = decoded;
  next();
};

/**
 * Middleware to require authentication
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

