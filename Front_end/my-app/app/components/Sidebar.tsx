'use client';
import Link from 'next/link';

interface SidebarProps {
  role: 'admin' | 'teacher' | 'student';
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ role, isOpen = false, onClose }: SidebarProps) {
  const menus: Record<string, string[]> = {
    admin: ['Manage Users', 'Classes', 'Reports'],
    teacher: ['My Classes', 'Assignments', 'Grades'],
    student: ['My Courses', 'Results', 'Profile'],
  };

  const roleClasses: Record<string, string> = {
    admin: 'sidebar admin',
    teacher: 'sidebar teacher',
    student: 'sidebar student',
  };

  return (
    <>
      {/* Overlay (only visible when sidebar open on mobile) */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <aside className={`${roleClasses[role]} ${isOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>

        <ul>
          {menus[role].map((item) => (
            <li key={item}>
              <Link href="#" className="sidebar-link">
                {item}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
