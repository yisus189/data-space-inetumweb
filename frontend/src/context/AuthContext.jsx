// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { loginApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dataspace_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    setUser(data.user);
    localStorage.setItem('dataspace_user', JSON.stringify(data.user));
    localStorage.setItem('dataspace_token', data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dataspace_user');
    localStorage.removeItem('dataspace_token');
  };

  const value = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}