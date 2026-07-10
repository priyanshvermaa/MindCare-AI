import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

const generateToken = (id, role = 'user', email = '', name = '') => {
  return jwt.sign({ id, userId: id, email, role, name }, process.env.JWT_SECRET || 'mindcare_jwt_secret_key_2026', {
    expiresIn: '30d',
  });
};

// Google OAuth Initiate
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Google OAuth Callback Handler
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      const errMsg = err ? err.message : 'Google authentication failed';
      return res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(errMsg)}`
      );
    }
    const token = generateToken(user._id, user.role, user.email, user.name);
    return res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?token=${token}`
    );
  })(req, res, next);
});

// GitHub OAuth Initiate
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

// GitHub OAuth Callback Handler
router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, user, info) => {
    if (err || !user) {
      const errMsg = err ? err.message : 'GitHub authentication failed';
      return res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(errMsg)}`
      );
    }
    const token = generateToken(user._id, user.role, user.email, user.name);
    return res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?token=${token}`
    );
  })(req, res, next);
});

export default router;
