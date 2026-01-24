import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const doctorNavItems: NavItem[] = [
  { label: 'Manage Patients', path: '/doctor/patients', icon: Users },
  { label: 'Program Templates', path: '/doctor/templates', icon: FileText },
  { label: 'Normal Plan Videos', path: '/doctor/normal-plan-videos', icon: BookOpen },
  { label: 'Normal Plan Monitor', path: '/doctor/normal-plan-monitor', icon: Activity },
  { label: 'Consultations', path: '/doctor/consultations', icon: Calendar },
  { label: 'Completed Patients', path: '/doctor/completed-patients', icon: CheckCircle },
  { label: 'Deactivated Patients', path: '/doctor/deactivated-patients', icon: UserX },
];

const patientNavItems: NavItem[] = [
  { label: 'My Tasks', path: '/patient/tasks', icon: ClipboardList },
  { label: 'Horizon Guide', path: '/patient/horizon-guide', icon: BookOpen },
  { label: 'Progress History', path: '/patient/progress', icon: BarChart3 },
  { label: 'Log Data', path: '/patient/log-data', icon: Activity },
  { label: 'My Bookings', path: '/patient/bookings', icon: BookOpen },
  { label: 'Book Consultation', path: '/patient/new-consultation', icon: Calendar },
  { label: 'Profile', path: '/patient/profile', icon: User },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed: boolean;
  onCollapseToggle: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  isOpen, 
  onToggle, 
  isCollapsed, 
  onCollapseToggle 
}) => {
  const { role, logout, user,planTier } = useAuth();
  const location = useLocation();
  const navItems = role === 'Doctor' ? doctorNavItems : patientNavItems;
  const isPatient = role === 'Patient';

  const handleLogout = async () => {
    await logout();
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  const NavItemContent = ({ item, isActive }: { item: NavItem; isActive: boolean }) => {
    const Icon = item.icon;
    
    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  'group flex items-center justify-center rounded-lg p-3 transition-all duration-200',
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
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <NavLink
        to={item.path}
        onClick={handleNavClick}
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
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg lg:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen gradient-teal transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            'flex h-20 items-center border-b border-sidebar-border',
            isCollapsed ? 'justify-center px-2' : 'px-6'
          )}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-phoenix shadow-phoenix shrink-0">
                <span className="text-lg font-bold text-primary-foreground">H</span>
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold text-sidebar-foreground">HorizonFit</span>
              )}
            </motion.div>
          </div>

          {/* User Info */}
          {!isCollapsed && (
            <div className="border-b border-sidebar-border px-6 py-4">
              <p className="text-sm text-sidebar-foreground/70">Welcome back,</p>
              <p className="font-semibold text-sidebar-foreground">{user?.name || 'User'}</p>
              <span className="mt-1 inline-block rounded-full bg-sidebar-foreground/10 px-2 py-0.5 text-xs text-sidebar-foreground">
                {role}
              </span>
            </div>
          )}

          {/* Collapse Toggle - Desktop Only */}
          <div className="hidden lg:flex justify-end px-2 py-2">
            <button
              onClick={onCollapseToggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className={cn(
            'flex-1 space-y-1 overflow-y-auto py-4',
            isCollapsed ? 'px-2' : 'px-3'
          )}>
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;

              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NavItemContent item={item} isActive={isActive} />
                </motion.div>
              );
            })}
          </nav>

          {/* Branding - Patient Dashboard Only */}
          {isPatient && !isCollapsed && (
            <div className="border-t border-sidebar-border px-4 py-3">
              <p className="text-xs text-secondary-light text-center leading-relaxed">
                Developed by <span className="font-medium">Javid Shariff</span>
                <br />
                <span className="text-sidebar-foreground/60">(Technical Lead) @ Aevon Inc</span>
              </p>
            </div>
          )}

          {/* Logout */}
          <div className={cn(
            'border-t border-sidebar-border p-3',
            isCollapsed && 'flex justify-center'
          )}>
            {isCollapsed ? (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-all duration-200 hover:bg-destructive/20 hover:text-destructive"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Logout</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-destructive/20 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};