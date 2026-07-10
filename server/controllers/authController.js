import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/email.js';

// Generate JWT token helper
export const generateToken = (id, role = 'user', tokenVersion = 0, email = '', name = '') => {
  return jwt.sign({ id, userId: id, email, role, name, tokenVersion }, process.env.JWT_SECRET || 'mindcare_jwt_secret_key_2026', {
    expiresIn: '30d',
  });
};

// Generate a random 6-digit numeric OTP
const generateNumericOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address.' });
    }

    // Standardize, validate and normalize role
    let finalRole = 'user';
    if (role) {
      const normalized = role.toString().toLowerCase().trim();
      if (normalized === 'admin' || normalized === 'administrator') {
        finalRole = 'admin';
      } else if (normalized === 'user' || normalized === 'employee') {
        finalRole = 'user';
      } else {
        return res.status(400).json({ success: false, message: 'Invalid role value. Allowed roles are: user, admin.' });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      isVerified: true,
      isEmailVerified: true,
    });

    if (user) {
      const userResponse = {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authMethod: user.authMethod,
        age: user.age,
        onboardingCompleted: user.onboardingCompleted,
        profilePicture: user.profilePicture || user.avatar || '',
        avatar: user.avatar || '',
      };

      if (!user.onboardingCompleted && (user.age === null || user.age === undefined)) {
        userResponse.onboardingRequired = true;
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful!',
        token: generateToken(user._id, user.role, user.tokenVersion, user.email, user.name),
        user: userResponse,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Authenticate user & get OTP (Phase 1)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.authMethod !== 'local') {
      return res.status(400).json({ 
        message: `This account is configured using ${user.authMethod} login. Please log in using that method.` 
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact an administrator.' });
    }

    const userResponse = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      authMethod: user.authMethod,
      age: user.age,
      onboardingCompleted: user.onboardingCompleted,
      profilePicture: user.profilePicture || user.avatar || '',
      avatar: user.avatar || '',
    };

    if (!user.onboardingCompleted && (user.age === null || user.age === undefined)) {
      userResponse.onboardingRequired = true;
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id, user.role, user.tokenVersion, user.email, user.name),
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Request password reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account registered with this email address.' });
    }

    if (user.authMethod !== 'local') {
      return res.status(400).json({ 
        message: `This account is configured using ${user.authMethod} login. Use that service instead.` 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Reset Link (Mock routing to React dashboard router)
    const resetUrl = `${process.env.CLIENT_URL || 'http://127.0.0.1:5173'}/forgot-password?token=${resetToken}`;
    const emailText = `You requested a password reset. Please click this link to reset your password:\n${resetUrl}\n\nThis link is active for 30 minutes.`;
    const emailHtml = `
      <h3>Password Reset Requested</h3>
      <p>We received a request to reset your password. Click the link below to complete the action:</p>
      <a href="${resetUrl}" style="background-color:#6366f1; color:#ffffff; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold; display:inline-block;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'MindCare AI — Password Reset Request',
        text: emailText,
        html: emailHtml,
      });
    } catch (err) {
      console.error('Failed to send reset link email: ', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email inbox.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset link.' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Google OAuth Auth Receiver
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = async (req, res) => {
  const { tokenId, name, email, profilePic } = req.body;

  try {
    // In a fully configured production env, we'd verify OAuth Client ID with:
    // const ticket = await client.verifyIdToken({ idToken: tokenId, audience: GOOGLE_CLIENT_ID });
    // const payload = ticket.getPayload();
    // For local mock verification, we extract user details directly.
    
    if (!email) {
      return res.status(400).json({ message: 'Google authentication data incomplete.' });
    }

    let user = await User.findOne({ email });

    if (user) {
      // Verify login method compatibility
      if (user.authMethod !== 'google' && user.authMethod !== 'local') {
        return res.status(400).json({ 
          message: `This account already exists using ${user.authMethod} login.` 
        });
      }
      
      // Update details to Google if authMethod was local but is validated
      if (user.authMethod === 'local') {
        user.authMethod = 'google';
        user.isEmailVerified = true;
        await user.save();
      }
    } else {
      // Create new Google User
      user = await User.create({
        name: name || 'Google User',
        email,
        isEmailVerified: true,
        authMethod: 'google',
        oauthId: tokenId,
      });
    }

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      authMethod: user.authMethod,
      age: user.age,
      onboardingCompleted: user.onboardingCompleted,
    };

    if (!user.onboardingCompleted && (user.age === null || user.age === undefined)) {
      userResponse.onboardingRequired = true;
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id, user.role, user.tokenVersion, user.email, user.name),
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    GitHub OAuth Auth Receiver
 * @route   POST /api/auth/github
 * @access  Public
 */
export const githubLogin = async (req, res) => {
  const { code, name, email } = req.body;

  try {
    // Similarly to Google, verify GitHub exchange token. In development mock mode,
    // we use code directly or simulate registration/login for testing.
    
    if (!email) {
      return res.status(400).json({ message: 'GitHub authentication data incomplete.' });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (user.authMethod !== 'github' && user.authMethod !== 'local') {
        return res.status(400).json({ 
          message: `This account already exists using ${user.authMethod} login.` 
        });
      }
      
      if (user.authMethod === 'local') {
        user.authMethod = 'github';
        user.isEmailVerified = true;
        await user.save();
      }
    } else {
      // Create new GitHub User
      user = await User.create({
        name: name || 'GitHub User',
        email,
        isEmailVerified: true,
        authMethod: 'github',
        oauthId: code,
      });
    }

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      authMethod: user.authMethod,
      age: user.age,
      onboardingCompleted: user.onboardingCompleted,
    };

    if (!user.onboardingCompleted && (user.age === null || user.age === undefined)) {
      userResponse.onboardingRequired = true;
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id, user.role, user.tokenVersion, user.email, user.name),
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
