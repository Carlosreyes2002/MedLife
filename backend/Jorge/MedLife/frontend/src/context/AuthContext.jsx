import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
};

const loadStoredUser = () => {
  try {
    const stored = localStorage.getItem('user');
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  const token = localStorage.getItem('token');
  return token ? decodeToken(token) : null;
};

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(loadStoredUser);

  const login = (newToken, userData) => {
    const resolvedUser = userData || decodeToken(newToken);
    localStorage.setItem('token', newToken);
    if (resolvedUser) {
      localStorage.setItem('user', JSON.stringify(resolvedUser));
    }
    setToken(newToken);
    setUser(resolvedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
