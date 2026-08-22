import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext(null);
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function getStoredToken() {
  try {
    const saved = localStorage.getItem('mandi_token');
    if (!saved || saved === 'null' || saved === 'undefined' || saved.trim() === '') {
      return null;
    }
    return saved.trim();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('mandi_token');
      localStorage.removeItem('mandi_login_time');
      localStorage.removeItem('mandi_super_admin_backup_token');
      localStorage.removeItem('mandi_super_admin_backup_user');
    } catch {}
    setToken(null);
    setUser(null);
  }, []);

  const isImpersonated = Boolean(
    (user && user.isImpersonated) || 
    localStorage.getItem('mandi_super_admin_backup_token')
  );

  const impersonateTenant = async (businessId) => {
    try {
      const res = await api.post(`/super-admin/businesses/${businessId}/impersonate`);
      const { token: impersonatedToken, user: impersonatedUser, business } = res.data;

      if (!impersonatedToken) {
        return { success: false, error: 'Failed to obtain impersonation credentials.' };
      }

      // Backup current super admin session
      const currentToken = getStoredToken();
      if (currentToken) {
        localStorage.setItem('mandi_super_admin_backup_token', currentToken);
        if (user) {
          localStorage.setItem('mandi_super_admin_backup_user', JSON.stringify(user));
        }
      }

      localStorage.setItem('mandi_token', impersonatedToken);
      localStorage.setItem('mandi_login_time', Date.now().toString());
      setToken(impersonatedToken);
      setUser(impersonatedUser);

      return { success: true, business };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Failed to start support impersonation session.' 
      };
    }
  };

  const exitImpersonation = async () => {
    try {
      const backupToken = localStorage.getItem('mandi_super_admin_backup_token');
      const backupUserStr = localStorage.getItem('mandi_super_admin_backup_user');

      localStorage.removeItem('mandi_super_admin_backup_token');
      localStorage.removeItem('mandi_super_admin_backup_user');

      if (backupToken) {
        localStorage.setItem('mandi_token', backupToken);
        setToken(backupToken);
        if (backupUserStr) {
          try {
            setUser(JSON.parse(backupUserStr));
          } catch {
            setUser(null);
          }
        }
        // Refresh original super admin profile from server
        try {
          const res = await api.get('/auth/profile');
          if (res.data) setUser(res.data);
        } catch {}
        return { success: true };
      } else {
        logout();
        return { success: true };
      }
    } catch (err) {
      logout();
      return { success: false, error: 'Failed to restore Super Admin session.' };
    }
  };

  const isSessionExpired = useCallback(() => {
    try {
      const loginTime = localStorage.getItem('mandi_login_time');
      if (!loginTime) return false;
      const elapsed = Date.now() - Number(loginTime);
      return elapsed >= TWENTY_FOUR_HOURS_MS;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    async function checkAuth() {
      const currentToken = getStoredToken();
      if (!currentToken) {
        logout();
        setLoading(false);
        return;
      }

      if (isSessionExpired()) {
        logout();
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/profile');
        if (res.data) {
          setUser(res.data);
        } else {
          logout();
        }
      } catch (err) {
        // Silently clear session if token is expired, invalid, or unauthorized
        logout();
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [token, isSessionExpired, logout]);

  // Periodic check to auto-expire session when 24 hours elapse
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (isSessionExpired()) {
        logout();
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [token, isSessionExpired, logout]);

  const login = async (identifier, password, role) => {
    try {
      const res = await api.post('/auth/login', { identifier, email: identifier, password, role });
      const { token: receivedToken, user: receivedUser } = res.data;

      if (!receivedToken) {
        return { success: false, error: 'Authentication failed. No token received.' };
      }

      const now = Date.now();
      localStorage.setItem('mandi_token', receivedToken);
      localStorage.setItem('mandi_login_time', now.toString());
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Authentication failed. Please check credentials.';
      return { success: false, error: errMsg };
    }
  };

  const refreshProfile = async () => {
    const currentToken = getStoredToken();
    if (!currentToken || isSessionExpired()) return;
    try {
      const res = await api.get('/auth/profile');
      if (res.data) {
        setUser(res.data);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      logout, 
      refreshProfile,
      impersonateTenant,
      exitImpersonation,
      isImpersonated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

