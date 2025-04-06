import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Simplified AuthContextType for PIN-based authentication without user roles
type AuthContextType = {
  isAuthenticated: boolean;
  authenticate: (pin: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// System-wide PIN for authentication
const CORRECT_PIN = "2025";
const AUTH_STORAGE_KEY = "inv-auth-status";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if system is already authenticated on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Simple PIN verification without user-specific logic
  const authenticate = (pin: string): boolean => {
    const isValid = pin === CORRECT_PIN;
    if (isValid) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    }
    return isValid;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}