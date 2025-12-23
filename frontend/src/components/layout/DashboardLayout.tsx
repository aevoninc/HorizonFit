import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { cn } from '@/lib/utils';

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar 
        isOpen={isSidebarOpen} 
        onToggle={toggleSidebar}
        isCollapsed={isCollapsed}
        onCollapseToggle={toggleCollapse}
      />
      <main
        className={cn(
          'min-h-screen p-4 pt-16 transition-all duration-300 lg:p-8 lg:pt-8',
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <Outlet />
      </main>
    </div>
  );
};