import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar />
      <main className="ml-64 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  );
};
