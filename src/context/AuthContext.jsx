import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mindcare_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if token exists on mount and load user profile
  useEffect(() => {
    const initializeUser = async () => {
      const storedToken = localStorage.getItem('mindcare_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setToken(storedToken);
        
        // Load user settings automatically after login
        try {
          const settingsRes = await api.get('/settings');
          if (settingsRes.data.success) {
            const theme = settingsRes.data.settings?.appearance?.theme || 'dark';
            if (theme === 'light') {
              document.documentElement.classList.add('light');
            } else {
              document.documentElement.classList.remove('light');
            }
            
            // Apply accent color
            const accentColor = settingsRes.data.settings?.appearance?.accentColor || '#14b8a6';
            document.documentElement.style.setProperty('--brand-accent', accentColor);
            
            // Apply font size
            const fontSize = settingsRes.data.settings?.appearance?.fontSize || 'medium';
            if (fontSize === 'small') {
              document.documentElement.style.fontSize = '14px';
            } else if (fontSize === 'large') {
              document.documentElement.style.fontSize = '18px';
            } else {
              document.documentElement.style.fontSize = '16px';
            }
          }
        } catch (sErr) {
          console.warn('Failed to load user settings in AuthProvider initialize:', sErr.message);
        }
      } catch (err) {
        console.error('Failed to load user profile: ', err);
        localStorage.removeItem('mindcare_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Save session helper
  const saveSession = async (authToken, userData) => {
    localStorage.setItem('mindcare_token', authToken);
    setToken(authToken);
    setUser(userData);
    setError(null);

    // Apply settings on saveSession
    try {
      const settingsRes = await api.get('/settings', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (settingsRes.data.success) {
        const theme = settingsRes.data.settings?.appearance?.theme || 'dark';
        if (theme === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
        
        // Apply accent color
        const accentColor = settingsRes.data.settings?.appearance?.accentColor || '#14b8a6';
        document.documentElement.style.setProperty('--brand-accent', accentColor);
        
        // Apply font size
        const fontSize = settingsRes.data.settings?.appearance?.fontSize || 'medium';
        if (fontSize === 'small') {
          document.documentElement.style.fontSize = '14px';
        } else if (fontSize === 'large') {
          document.documentElement.style.fontSize = '18px';
        } else {
          document.documentElement.style.fontSize = '16px';
        }
      }
    } catch (sErr) {
      console.warn('Failed to load user settings in AuthProvider saveSession:', sErr.message);
    }
  };

  // Register User
  const registerUser = async (name, email, password, role) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const data = response.data;
      await saveSession(data.token, data.user);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Registration failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Login User
  const loginUser = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      await saveSession(data.token, data.user);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Login failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Google OAuth Login
  const loginWithGoogle = async (tokenId, name, email) => {
    setError(null);
    try {
      const response = await api.post('/auth/google', { tokenId, name, email });
      const data = response.data;
      await saveSession(data.token, data.user);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Google login failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // GitHub OAuth Login
  const loginWithGithub = async (code, name, email) => {
    setError(null);
    try {
      const response = await api.post('/auth/github', { code, name, email });
      const data = response.data;
      await saveSession(data.token, data.user);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'GitHub login failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Login using a token (for OAuth callbacks)
  const loginWithToken = async (authToken) => {
    setError(null);
    try {
      const response = await api.get('/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const data = response.data;
      saveSession(authToken, data.user);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Token verification failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Forgot Password request
  const requestPasswordReset = async (email) => {
    setError(null);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Request failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Reset Password recovery
  const resetPassword = async (tokenParam, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/reset-password', { token: tokenParam, password });
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Password reset failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Log Out
  const logout = () => {
    localStorage.removeItem('mindcare_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const updateUserProfile = async (profileData) => {
    try {
      const response = await api.patch('/user/profile', profileData);
      if (response.data.success) {
        setUser((prev) => {
          const updated = {
            ...prev,
            ...response.data.profile,
          };
          if (response.data.profile.onboardingRequired === undefined) {
            delete updated.onboardingRequired;
          }
          return updated;
        });
      }
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const updateUserAge = async (age) => {
    return updateUserProfile({ age });
  };

  const refreshUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
      return response.data;
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  // API Request client wrapper that injects Authorization headers automatically
  const authenticatedRequest = async (endpoint, options = {}) => {
    try {
      const response = await api({
        url: endpoint,
        method: options.method || 'GET',
        data: options.body ? JSON.parse(options.body) : undefined,
        headers: options.headers,
      });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'API request failed.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        error,
        registerUser,
        loginUser,
        loginWithGoogle,
        loginWithGithub,
        loginWithToken,
        requestPasswordReset,
        resetPassword,
        logout,
        updateUserAge,
        updateUserProfile,
        refreshUserProfile,
        authenticatedRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
