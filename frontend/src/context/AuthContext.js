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
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    // Always verify auth state with backend using HttpOnly cookie
    // Never rely on sessionStorage for auth state (client-only, not sent with requests)
    fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data.user) {
          // Use a dummy token to indicate authenticated state (actual token is in HttpOnly cookie)
          const dummyToken = 'authenticated';
          setToken(dummyToken);
          setUser(data.data.user);
        } else {
          setToken(null);
          setUser(null);
        }
      })
      .catch(e => {
        console.error('Failed to verify session with backend', e);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
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
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const receivedUser = data.data.user;
      
      // Use dummy token to indicate authenticated state
      // The actual JWT token is stored in HttpOnly cookie on backend
      const dummyToken = 'authenticated';
      setToken(dummyToken);
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
        credentials: 'include',
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
        API_BASE_URL, // Exposing hardcoded API base URL for convenience
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
