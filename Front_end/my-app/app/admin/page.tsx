'use client';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import "../styles/dashboard.css";

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-container">
      <Sidebar
        role="admin"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="dashboard-main">
        <Navbar
          role="admin"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="dashboard-content">
          <h2 className="dashboard-title">Welcome, Admin!</h2>
          <div className="dashboard-grid">
            <div className="dashboard-card admin-card">
              <h3 className="dashboard-card-title">User Overview</h3>
              <p>Total Users: <span className="dashboard-highlight">240</span></p>
            </div>
            <div className="dashboard-card admin-card">
              <h3 className="dashboard-card-title">Reports Pending</h3>
              <p className="dashboard-highlight">5</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
