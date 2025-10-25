import React, { useState } from 'react';
import './App.css';

// --- THIS IS THE FIX ---
// Import all icons from 'fa6' and include FaRightFromBracket
import { FaUserDoctor, FaBrain, FaRightFromBracket } from 'react-icons/fa6'; 
// --- END FIX ---

import DoctorTab from './components/DoctorTab';
import TherapistTab from './components/TherapistTab';
import LandingPage from './components/LandingPage';

// --- IMPORTS FOR AUTH ---
import { useAuth } from './context/AuthContext'; 
import { useNavigate } from 'react-router-dom'; 

function App() {
  const [activeTab, setActiveTab] = useState('doctor');
  const [showLandingPage, setShowLandingPage] = useState(true);
  
  // --- HOOKS FOR AUTH ---
  const { logout } = useAuth(); 
  const navigate = useNavigate(); 

  const handleEnterApp = (mode) => {
    setActiveTab(mode);
    setShowLandingPage(false);
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      alert('Failed to log out');
    }
  };

  if (showLandingPage) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  return (
    <div className="app-layout">
      <div className="app-sidebar">
        <header>
          <h1>Careva</h1>
          <p>Your personal health and wellness companion</p>
        </header>

        <nav className={`tabs ${activeTab}-active`}>
          <button
            className={`tab-link ${activeTab === 'doctor' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctor')}
          >
            <FaUserDoctor /> AI Doctor
          </button>
          <button
            className={`tab-link ${activeTab === 'therapist' ? 'active' : ''}`}
            onClick={() => setActiveTab('therapist')}
          >
            <FaBrain /> AI Therapist
          </button>
        </nav>

        {/* --- ADD LOGOUT BUTTON WITH CORRECT ICON --- */}
        <button 
          className="tab-link logout-button" 
          onClick={handleLogout}
          style={{ marginTop: 'auto', background: '#fce4ec' }} // Quick inline style
        >
          <FaRightFromBracket /> Logout
        </button>
      </div>

      <main className="app-content">
        {activeTab === 'doctor' && <DoctorTab />}
        {activeTab === 'therapist' && <TherapistTab />}
      </main>
    </div>
  );
}

export default App;