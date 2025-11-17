'use client';
import Link from 'next/link';

interface NavbarProps {
  role: 'admin' | 'teacher' | 'student';
  onToggleSidebar?: () => void;
}

export default function Navbar({ role, onToggleSidebar }: NavbarProps) {
  const colors: Record<string, string> = {
    admin: 'admin-navbar',
    teacher: 'teacher-navbar',
    student: 'student-navbar',
  };

  return (
    <nav className={`navbar ${colors[role]}`}>
      {/* ☰ Hamburger Menu Button */}
      <button className="menu-btn" onClick={onToggleSidebar}>
        &#9776;
      </button>

      <h1 className="navbar-title">{role} Dashboard</h1>

      <Link href="/login" className="logout-link">Logout</Link>
    </nav>
  );
}
