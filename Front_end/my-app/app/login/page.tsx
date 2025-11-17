'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import "../styles/login.css"; // 👈 Import plain CSS

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple mock auth logic
    if (email && password) {
      if (role === 'admin') router.push('/admin');
      if (role === 'teacher') router.push('/teacher');
      if (role === 'student') router.push('/student');
    }
  };

  return (
    <main className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h1 className="login-title">Login</h1>

        <label className="login-label">Role:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="login-input"
        >
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>

        <label className="login-label">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          required
        />

        <label className="login-label">Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          required
        />

        <button type="submit" className="login-button">Login</button>
      </form>
      <aside className='aside-image'>
        
      </aside>
    </main>
  );
}
