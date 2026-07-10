import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Route protector using JWT Bearer authentication headers
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mindcare_jwt_secret_key_2026');

      // Get user from the token, omitting the password field
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user || req.user.isDeleted) {
        return res.status(401).json({ message: 'User session expired or account has been deleted. Access denied.' });
      }

      // Update activity timestamp asynchronously
      User.findByIdAndUpdate(req.user._id, { lastActiveAt: new Date() }).catch(err => 
        console.error('Failed to update activity timestamp:', err.message)
      );

      if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== req.user.tokenVersion) {
        return res.status(401).json({ message: 'Not authorized, session expired (logged out from all devices).' });
      }

      if (req.user.isSuspended) {
        return res.status(403).json({ message: 'Your account has been suspended by an administrator.' });
      }

      next();
    } catch (error) {
      console.error('JWT validation failure: ', error.message);
      return res.status(401).json({ message: 'Not authorized, session token invalid or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, access token missing.' });
  }
};

// Role-based authorization middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: User role '${req.user?.role || 'unknown'}' is not authorized to access this resource.`,
      });
    };
    next();
  };
};
