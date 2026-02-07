import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <span className="logo">🌙</span>
          <span className="brand-name">MoodEcho</span>
        </Link>
      </div>

      {isAuthenticated && (
        <>
          <div className="navbar-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/walk">Mood Walks</Link>
          </div>

          <div className="navbar-user">
            <span className="username">{user.username}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </>
      )}
    </nav>
  );
}