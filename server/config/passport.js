import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

// Google Strategy Configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          return done(new Error('Google account does not provide email access.'), null);
        }

        let user = await User.findOne({
          $or: [
            { email },
            { googleId: profile.id }
          ]
        });

        const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

        if (user) {
          // Link Google ID if not already linked
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.authMethod = 'google';
          user.avatar = avatarUrl;
          user.isEmailVerified = true;
          user.emailVerified = true;
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName || profile.name || 'Google User',
          email: email,
          googleId: profile.id,
          authProvider: 'google',
          authMethod: 'google',
          avatar: avatarUrl,
          isEmailVerified: true,
          emailVerified: true,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// GitHub Strategy Configuration
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || 'dummy_id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy_secret',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        // Try to fetch private emails if not available in the public profile
        if (!email && accessToken) {
          try {
            const emailResponse = await fetch('https://api.github.com/user/emails', {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'MindCare-AI',
              },
            });
            if (emailResponse.ok) {
              const emails = await emailResponse.json();
              if (Array.isArray(emails)) {
                const primaryEmailObj = emails.find(e => e.primary && e.verified) || 
                                       emails.find(e => e.verified) || 
                                       emails[0];
                if (primaryEmailObj && primaryEmailObj.email) {
                  email = primaryEmailObj.email;
                }
              }
            }
          } catch (err) {
            console.error('Failed to fetch private emails from GitHub API:', err.message);
          }
        }

        const username = profile.username || 'github_user';
        const finalEmail = email || `${username}@users.noreply.github.com`;

        let user = await User.findOne({
          $or: [
            { email: finalEmail },
            { githubId: profile.id }
          ]
        });

        const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

        if (user) {
          user.githubId = profile.id;
          user.authProvider = 'github';
          user.authMethod = 'github';
          user.avatar = avatarUrl;
          user.isEmailVerified = true;
          user.emailVerified = true;
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          name: profile.displayName || profile.username || 'GitHub User',
          email: finalEmail,
          githubId: profile.id,
          authProvider: 'github',
          authMethod: 'github',
          avatar: avatarUrl,
          isEmailVerified: true,
          emailVerified: true,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Boilerplate Passport serialize/deserialize (though we run session-less JWT, passport requires these sometimes)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
