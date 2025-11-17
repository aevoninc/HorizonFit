'use client';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import "../styles/dashboard.css";

export default function StudentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-container">
      <Sidebar
        role="student"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="dashboard-main">
        <Navbar
          role="student"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="dashboard-content">
          <h2 className="dashboard-title">Welcome, Student!</h2>
          <div className="dashboard-grid">
            <div className="dashboard-card student-card">
              <h3 className="dashboard-card-title">Current Courses</h3>
              <ul className="dashboard-list">
                <li>Web Development</li>
                <li>Data Structures</li>
              </ul>
            </div>
            <div className="dashboard-card student-card">
              <h3 className="dashboard-card-title">Results</h3>
              <p className="dashboard-highlight student-highlight">A+</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
