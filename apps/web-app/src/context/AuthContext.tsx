'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../lib/apiClient'; 

interface User {
  id: string;
  email: string;
  username?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean; // This will represent initial auth load AND API call loading
  error: string | null;
  login: (emailP: string, passwordP: string) => Promise<boolean>;
  register: (emailP: string, passwordP: string, usernameP?: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // True initially for localStorage check
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const persistedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const persistedUserJson = localStorage.getItem(AUTH_USER_KEY);

    if (persistedToken && persistedUserJson) {
      try {
        const persistedUser = JSON.parse(persistedUserJson) as User;
        setToken(persistedToken);
        setUser(persistedUser);
      } catch (e) {
        console.error("Failed to parse persisted user data", e);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
    setIsLoading(false); // Done with initial load attempt
  }, []);

  const clearError = () => { // <--- DEFINE clearError
    // console.log("AuthContext: Clearing error");
    setError(null);
  };

  const login = async (emailP: string, passwordP: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null); // Clear previous errors
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
      console.log("AuthContext: Error set to:", errorMessage); // Add this
      setIsLoading(false);
      return false;
    }
  };

  const register = async (emailP: string, passwordP: string, usernameP?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      const payload: any = { email: emailP, password: passwordP };
      if (usernameP) payload.username = usernameP;
      await apiClient.post('/auth/register', payload);
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
    setError(null); // Clear errors on logout
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  };
  
  const value = { user, token, isLoading, error, login, register, logout, clearError }; 

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};