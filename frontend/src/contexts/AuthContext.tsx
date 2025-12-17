import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { authApi } from "@/lib/api";

type UserRole = "Patient" | "Doctor" | null;

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
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [role, setRole] = useState<UserRole>(() => {
    return sessionStorage.getItem("userRole") as UserRole;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount (user info from sessionStorage, tokens from HttpOnly cookies)
  useEffect(() => {
    const initializeAuth = async () => {
      const storedRole = sessionStorage.getItem("userRole") as UserRole;
      const storedUser = sessionStorage.getItem("user");

      if (storedRole && storedUser) {
        try {
          // 1. SET STATE IMMEDIATELY (Don't wait for API)
          const parsedUser = JSON.parse(storedUser);
          setRole(storedRole);
          setUser(parsedUser);

          // 2. Then validate tokens in the background
          await authApi.refreshToken();
        } catch (error) {
          console.error("Session restoration failed", error);
          // Only clear if the refresh actually fails
          sessionStorage.clear();
          setRole(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      // 1. Destructure 'user' and 'role' from response.data
      // 2. Then get the details FROM that user object
      const { user: backendUser, role: userRole } = response.data;

      const userData = {
        id: backendUser._id,
        email: backendUser.email,
        name: backendUser.name || "User",
      };

      setUser(userData);
      setRole(userRole);

      sessionStorage.setItem("userRole", userRole);
      sessionStorage.setItem("user", JSON.stringify(userData));

      return { success: true, role: userRole };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed";
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Backend logout failed", error);
    } finally {
      // 1. Clear local state
      setUser(null);
      setRole(null);

      // 2. Clear storage
      sessionStorage.clear();

      // 3. Force redirect to clear any stuck React memory/states
      window.location.href = "/auth";
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      await authApi.refreshToken();
      return true;
    } catch {
      // Session expired - clear everything
      setUser(null);
      setRole(null);
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("user");
      return false;
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
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
