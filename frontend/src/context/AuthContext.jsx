import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smartpg_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await API.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('smartpg_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session validation error:', err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (email, password, role) => {
    const res = await API.post('/auth/login', { email, password, role });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('smartpg_token', res.data.token);
      localStorage.setItem('smartpg_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const signup = async (userData) => {
    const res = await API.post('/auth/register', userData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('smartpg_token', res.data.token);
      localStorage.setItem('smartpg_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const updateProfile = async (profileData) => {
    const res = await API.put('/auth/me', profileData);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('smartpg_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smartpg_token');
    localStorage.removeItem('smartpg_user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
