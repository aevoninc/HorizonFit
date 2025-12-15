import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '@/lib/api';

type UserRole = 'Patient' | 'Doctor' | null;

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
useEffect(() => {
  const storedRole = sessionStorage.getItem('userRole') as UserRole;
  const storedUser = sessionStorage.getItem('user');
  
  // Only proceed if we have a role AND a non-empty, non-null user string
  if (storedRole && storedUser) {
   try {
    setRole(storedRole);
    setUser(JSON.parse(storedUser));
   } catch (e) {
    // If parsing fails (e.g., SyntaxError), clear the corrupted data
    console.error("Corrupted session data cleared:", e);
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('user');
   }
  }
  setIsLoading(false);
 }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const { role: userRole, user: userData } = response.data;
      
      setUser(userData);
      setRole(userRole);
      
      // Store in session for page refresh persistence
      sessionStorage.setItem('userRole', userRole);
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, role: userRole };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('Logging out user:', user); 
      await authApi.logout();
    } catch {
      // Continue with logout even if API fails
    } finally {
      setUser(null);
      setRole(null);
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('user');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        role,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
