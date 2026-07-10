import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: function() {
        return this.authMethod === 'local';
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password field by default in queries
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    
    authMethod: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
    oauthId: String,
    
    // OAuth production-ready fields
    googleId: String,
    githubId: String,
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
    avatar: String,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    age: {
      type: Number,
      default: null,
    },
    recommendedSleep: {
      type: String,
      default: '',
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    height: {
      type: Number,
      default: null,
    },
    weight: {
      type: Number,
      default: null,
    },
    activityLevel: {
      type: String,
      default: '',
    },
    wellnessGoal: {
      type: String,
      default: '',
    },
    practitionerStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'none'],
      default: 'none',
    },
    assignedPractitioner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
