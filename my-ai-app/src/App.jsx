import React, { useState } from 'react';
import './App.css';

// Remove FaHeadset if not used elsewhere, or keep if needed
import { FaUserDoctor, FaBrain, FaRightFromBracket, FaHeadset } from 'react-icons/fa6'; 
import DoctorTab from './components/DoctorTab';
import TherapistTab from './components/TherapistTab';
import LandingPage from './components/LandingPage';
import SupportChatbot from './components/SupportChatbot'; // Keep this import

import { useAuth } from './context/AuthContext'; 
import { useNavigate } from 'react-router-dom'; 

function App() {
  const [activeTab, setActiveTab] = useState('doctor'); 
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showSupportChat, setShowSupportChat] = useState(false); // <-- NEW State

  const { logout } = useAuth(); 
  const navigate = useNavigate(); 

  const handleEnterApp = (mode) => {
    setActiveTab(mode); 
    setShowLandingPage(false);
  };

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

        {/* --- REMOVED 'support-active' logic --- */}
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
          {/* --- REMOVED Support Chat Button --- */}
        </nav>
        
        <div style={{ marginTop: 'auto', padding: '1em 0' }}>
          <w3m-button />
        </div>

        <button 
          className="tab-link logout-button" 
          onClick={handleLogout}
          style={{ background: '#fce4ec' }} 
        >
          <FaRightFromBracket /> Logout
        </button>
      </div>

      <main className="app-content">
        {/* --- Render main tabs --- */}
        {activeTab === 'doctor' && <DoctorTab />}
        {activeTab === 'therapist' && <TherapistTab />}

        {/* --- NEW: Floating Action Button (FAB) to toggle chatbot --- */}
        <button 
          className="support-fab" 
          onClick={() => setShowSupportChat(prev => !prev)}
          title={showSupportChat ? "Close Support Chat" : "Open Support Chat"}
        >
          <FaHeadset size={24} />
        </button>

        {/* --- NEW: Conditionally Render Support Chatbot --- */}
        {showSupportChat && (
          <div className="support-chatbot-overlay">
            <SupportChatbot onClose={() => setShowSupportChat(false)} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;