'use client';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import "../styles/dashboard.css";

export default function TeacherPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-container">
      <Sidebar
        role="teacher"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="dashboard-main">
        <Navbar
          role="teacher"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="dashboard-content">
          <h2 className="dashboard-title">Welcome, Teacher!</h2>
          <div className="dashboard-grid">
            <div className="dashboard-card teacher-card">
              <h3 className="dashboard-card-title">Today’s Classes</h3>
              <ul className="dashboard-list">
                <li>Math - 9 AM</li>
                <li>Physics - 11 AM</li>
              </ul>
            </div>
            <div className="dashboard-card teacher-card">
              <h3 className="dashboard-card-title">Pending Assignments</h3>
              <p className="dashboard-highlight teacher-highlight">6</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
