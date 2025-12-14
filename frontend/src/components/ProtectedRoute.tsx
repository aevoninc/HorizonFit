import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'Patient' | 'Doctor';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-soft">
          <div className="h-12 w-12 rounded-full gradient-phoenix" />
        </div>
      </div>
    );
  }

  // if (!isAuthenticated) {
  //   return <Navigate to="/auth" state={{ from: location }} replace />;
  // }

  if (requiredRole && role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = role === 'Doctor' ? '/doctor/patients' : '/patient/tasks';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
