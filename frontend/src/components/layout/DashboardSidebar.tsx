import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  ClipboardList,
  BarChart3,
  User,
  LogOut,
  CheckCircle,
  UserPlus,
  UserX,
  Activity,
  BookOpen,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const doctorNavItems: NavItem[] = [
  { label: 'Manage Patients', path: '/doctor/patients', icon: Users },
  { label: 'Program Templates', path: '/doctor/templates', icon: FileText },
  { label: 'Consultations', path: '/doctor/consultations', icon: Calendar },
  { label: 'Completed Patients', path: '/doctor/completed-patients', icon: CheckCircle },
  { label: 'Deactivated Patients', path: '/doctor/deactivated-patients', icon: UserX },
  { label: 'New Requests', path: '/doctor/new-requests', icon: UserPlus },
];

const patientNavItems: NavItem[] = [
  { label: 'My Tasks', path: '/patient/tasks', icon: ClipboardList },
  { label: 'Progress History', path: '/patient/progress', icon: BarChart3 },
  { label: 'Log Data', path: '/patient/log-data', icon: Activity },
  { label: 'My Bookings', path: '/patient/bookings', icon: BookOpen },
  { label: 'Book Consultation', path: '/patient/new-consultation', icon: Calendar },
  { label: 'Profile', path: '/patient/profile', icon: User },
];

export const DashboardSidebar: React.FC = () => {
  const { role, logout, user } = useAuth();
  const location = useLocation();
  const navItems = role === 'Doctor' ? doctorNavItems : patientNavItems;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 gradient-teal">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-sidebar-border px-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-phoenix shadow-phoenix">
              <span className="text-lg font-bold text-primary-foreground">H</span>
            </div>
            <span className="text-xl font-bold text-sidebar-foreground">HorizonFit</span>
          </motion.div>
        </div>

        {/* User Info */}
        <div className="border-b border-sidebar-border px-6 py-4">
          <p className="text-sm text-sidebar-foreground/70">Welcome back,</p>
          <p className="font-semibold text-sidebar-foreground">{user?.name || 'User'}</p>
          <span className="mt-1 inline-block rounded-full bg-sidebar-foreground/10 px-2 py-0.5 text-xs text-sidebar-foreground">
            {role}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NavLink
                  to={item.path}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-foreground/15 text-sidebar-foreground shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                      isActive && 'text-primary-glow'
                    )}
                  />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto h-2 w-2 rounded-full gradient-phoenix"
                    />
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-destructive/20 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};
