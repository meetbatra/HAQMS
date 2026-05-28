'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // HARDCODED API VALUE: Intentionally hardcoding the backend base URL on the frontend!
  // This violates production standards and prevents simple domain config, but serves as
  // a perfect exercise for internship candidates to move to environment variables.
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  const logout = async () => {
    try {
      const token = localStorage.getItem('haqms_token');
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    // Always clear local state regardless of backend response
    localStorage.removeItem('haqms_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    // On app load, try to restore token from localStorage
    const storedToken = localStorage.getItem('haqms_token');
    
    if (storedToken) {
      console.log('[AUTH] Found token in localStorage, verifying with backend...');
      // Verify token is still valid by calling /auth/me
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(res => {
          if (!res.ok) {
            console.warn(`[AUTH] /auth/me returned ${res.status}, token may be expired`);
            localStorage.removeItem('haqms_token');
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data && data.status === 'success' && data.data.user) {
            console.log('[AUTH] Session verified with user:', data.data.user.email);
            setToken(storedToken);
            setUser(data.data.user);
          } else {
            console.log('[AUTH] Token validation failed');
            localStorage.removeItem('haqms_token');
            setToken(null);
            setUser(null);
          }
        })
        .catch(e => {
          console.error('[AUTH] Failed to verify token:', e.message);
          localStorage.removeItem('haqms_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      console.log('[AUTH] No token in localStorage');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const receivedUser = data.data.user;
      const receivedToken = data.data.token;

      // Store JWT in localStorage for persistent auth across page reloads
      localStorage.setItem('haqms_token', receivedToken);
      console.log('[AUTH] Token stored in localStorage');

      // Set state
      setToken(receivedToken);
      setUser(receivedUser);

      router.push('/dashboard');
      return { success: true };
    } catch (err) {
      console.error('[AUTH-ERROR] Login request failed:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role = 'RECEPTIONIST') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // After registration, log them in automatically
      return login(email, password);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get authorization headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('haqms_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };



  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        API_BASE_URL,
        getAuthHeaders, // Helper to get Authorization headers
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
