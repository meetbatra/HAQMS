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
    sessionStorage.removeItem('haqms_token');
    sessionStorage.removeItem('haqms_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    // Check for stored token and user on initialization
    const storedToken = sessionStorage.getItem('haqms_token');
    const storedUser = sessionStorage.getItem('haqms_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setLoading(false);
      } catch (e) {
        console.error('Failed to parse user details from localStorage', e);
        logout();
      }
    } else {
      // If sessionStorage is empty, the user might still have a valid HttpOnly cookie.
      // We must verify with the backend to prevent an infinite redirect loop with the proxy.
      fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data.user) {
            // We don't have the raw JWT anymore, but the app just checks if token exists.
            const dummyToken = 'cookie-auth-token';
            setToken(dummyToken);
            setUser(data.data.user);
            sessionStorage.setItem('haqms_token', dummyToken);
            sessionStorage.setItem('haqms_user', JSON.stringify(data.data.user));
          } else {
            // If the backend also says no, we clear everything to be safe.
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
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Inconsistent API returns nested success format for login
      const receivedToken = data.data.token;
      const receivedUser = data.data.user;

      // SECURITY ISSUE: Storing sensitive auth credentials directly in LocalStorage!
      sessionStorage.setItem('haqms_token', receivedToken);
      sessionStorage.setItem('haqms_user', JSON.stringify(receivedUser));

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
        credentials: 'include',
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // If registration succeeds, log them in automatically or redirect to login.
      // Notice inconsistency: signup API returns flat user structure inside "user"
      // we can trigger login for them.
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
