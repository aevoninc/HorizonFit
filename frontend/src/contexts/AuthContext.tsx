import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { authApi } from "@/lib/api";
import { PageLoader } from "@/components/ui/PageLoader";

type UserRole = "Patient" | "Doctor" | null;
type PlanTier = "normal" | "premium" | null;

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole;
  planTier: PlanTier;
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
  const [planTier, setPlanTier] = useState<PlanTier>(() => {
    return sessionStorage.getItem("planTier") as PlanTier;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount (user info from sessionStorage, tokens from HttpOnly cookies)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedRole = sessionStorage.getItem("userRole") as UserRole;
        const storedUser = sessionStorage.getItem("user");
        const storedPlanTier = sessionStorage.getItem("planTier") as PlanTier;
        const hasToken = !!localStorage.getItem("accessToken");

        console.log("AuthProvider: Initializing Auth...", { storedRole, hasToken });

        if (hasToken || (storedRole && storedUser)) {
          // 1. SET STATE IMMEDIATELY (Optimistic restore)
          if (storedRole && storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setRole(storedRole);
            setUser(parsedUser);
            setPlanTier(storedPlanTier);
            console.log("AuthProvider: Restored state from storage", { role: storedRole, user: parsedUser.email });
          }

          // 2. VERIFY with backend (High fidelity check)
          try {
            const response = await authApi.getMe();
            console.log("AuthProvider: Session verified via /me", response.data);
            // Update state with fresh data from server
            const { user: backendUser, role: userRole, planTier: backendPlanTier } = response.data;
            const userData = {
              id: backendUser._id,
              email: backendUser.email,
              name: backendUser.name || "User",
            };
            setUser(userData);
            setRole(userRole);
            setPlanTier(backendPlanTier);

            // Sync storage
            sessionStorage.setItem("userRole", userRole);
            sessionStorage.setItem("user", JSON.stringify(userData));
            sessionStorage.setItem("planTier", backendPlanTier);
          } catch (meError) {
            console.warn("AuthProvider: /me verification failed, attempting refresh", meError);
            // 3. Attempt refresh if /me fails (e.g. accessToken expired but refreshToken still valid)
            await authApi.refreshToken();
            const retryResponse = await authApi.getMe();
            console.log("AuthProvider: Session restored after refresh", retryResponse.data);
          }
        }
      } catch (error) {
        console.error("Session restoration failed", error);
        // Only clear if the refresh actually fails
        sessionStorage.clear();
        localStorage.clear();
        setRole(null);
        setUser(null);
        setPlanTier(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log("AuthProvider: Attempting login for", email);
      const response = await authApi.login(email, password);
      console.log("AuthProvider: Login result", response.data);
      const { user: backendUser, role: userRole, planTier, accessToken, refreshToken } = response.data;

      const userData = {
        id: backendUser._id,
        email: backendUser.email,
        name: backendUser.name || "User",
      };

      setUser(userData);
      setRole(userRole);
      setPlanTier(planTier);

      // Save for next session
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      sessionStorage.setItem("planTier", planTier);
      sessionStorage.setItem("userRole", userRole);
      sessionStorage.setItem("user", JSON.stringify(userData));

      return { success: true, role: userRole };
    } catch (error: any) {
      setUser(null);
      localStorage.clear();
      // Re-throw so the UI can catch and display specific server errors
      throw error;
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
      localStorage.clear();

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
      sessionStorage.clear();
      localStorage.clear();
      return false;
    }
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        role,
        planTier,
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
