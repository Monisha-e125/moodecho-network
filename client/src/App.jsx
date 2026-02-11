import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Navbar from './components/Common/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';
import WalkLobby from './components/Walk/WalkLobby';
import WalkExperience from './components/Walk/WalkExperience';
import './assets/styles/global.css';
import DarkModeToggle from './components/Common/DarkModeToggle';
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <DarkModeToggle />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />

              <Route path="/walk" element={
                <ProtectedRoute>
                  <WalkLobby />
                </ProtectedRoute>
              } />

              <Route path="/walk/:walkId" element={
                <ProtectedRoute>
                  <WalkExperience />
                </ProtectedRoute>
              } />

              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}