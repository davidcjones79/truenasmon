import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, UserRole } from '../api/types';
import { getCurrentUser, login as apiLogin, logout as apiLogout, getStoredToken, getMustChangePassword, clearMustChangePassword } from '../api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  onPasswordChanged: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  canAcknowledgeAlerts: boolean;
  canManageUsers: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const isAuthenticated = !!user;

  const hasRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const canAcknowledgeAlerts = hasRole(['admin', 'operator']);
  const canManageUsers = hasRole(['admin']);

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch {
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    setMustChangePassword(getMustChangePassword());
    await refreshUser();
  };

  const logout = async () => {
    setUser(null);
    setMustChangePassword(false);
    await apiLogout();
  };

  const onPasswordChanged = () => {
    setMustChangePassword(false);
    clearMustChangePassword();
  };

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          await refreshUser();
          // Check if user needs to change password
          setMustChangePassword(getMustChangePassword());
        } catch {
          // Token invalid, will be handled by interceptor
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        mustChangePassword,
        login,
        logout,
        refreshUser,
        onPasswordChanged,
        hasRole,
        canAcknowledgeAlerts,
        canManageUsers,
      }}
    >
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
