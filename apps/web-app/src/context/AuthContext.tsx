'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../lib/apiClient'; // Our configured axios instance

// Define types for user and context
interface User {
  id: string;
  email: string;
  username?: string | null;
  // Add other relevant user fields you get from /me or login
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (emailP: string, passwordP: string) => Promise<boolean>;
  register: (emailP: string, passwordP: string, usernameP?: string) => Promise<boolean>;
  logout: () => void;
  // verifyAuth: () => Promise<void>; // Optional: function to verify token on app load
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to load persisted auth state on initial mount
  useEffect(() => {
    const persistedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const persistedUserJson = localStorage.getItem(AUTH_USER_KEY);

    if (persistedToken && persistedUserJson) {
      try {
        const persistedUser = JSON.parse(persistedUserJson) as User;
        setToken(persistedToken);
        setUser(persistedUser);
        // Optional: verify token with a /me request here to ensure it's still valid
        // For now, we'll trust the stored token until an API call fails with 401
      } catch (e) {
        console.error("Failed to parse persisted user data", e);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (emailP: string, passwordP: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/login', { email: emailP, password: passwordP });
      const { token: apiToken, userId, email, username } = response.data;
      
      const userData: User = { id: userId, email, username };
      
      setToken(apiToken);
      setUser(userData);
      localStorage.setItem(AUTH_TOKEN_KEY, apiToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      setIsLoading(false);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (emailP: string, passwordP: string, usernameP?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: any = { email: emailP, password: passwordP };
      if (usernameP) payload.username = usernameP;
      await apiClient.post('/auth/register', payload);
      // Registration successful, but user needs to login separately
      setIsLoading(false);
      return true; 
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    // Optionally, redirect to home or login page
    // No API call needed for stateless JWT logout unless you have server-side sessions/revocation
  };
  
  // Optional: Function to verify token with /me endpoint (e.g., on app load)
  // const verifyAuth = async () => { ... }

  const value = { user, token, isLoading, error, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};