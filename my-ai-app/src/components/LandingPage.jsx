import React from 'react';
import { FaUserDoctor, FaBrain, FaArrowRight } from 'react-icons/fa6';

function LandingPage({ onEnterApp }) {
  return (
    <div className="landing-page-container">
      <header className="landing-header">
        <h1 className="landing-title">Careva</h1>
        <p className="landing-subtitle">Choose your Intelligent Healthcare Companion</p>
      </header>

      <main className="landing-main-content">
        <section className="feature-section">
          <button onClick={() => onEnterApp('doctor')} className="feature-card">
            <FaUserDoctor className="feature-icon" />
            <h3>AI Doctor</h3>
            <p>Get instant insights on general health questions and image analysis.</p>
            <span className="enter-text">Enter <FaArrowRight /></span>
          </button>
          <button onClick={() => onEnterApp('therapist')} className="feature-card">
            <FaBrain className="feature-icon" />
            <h3>AI Therapist</h3>
            <p>Access empathetic mental health support and guidance, anytime you need.</p>
            <span className="enter-text">Enter <FaArrowRight /></span>
          </button>
        </section>
      </main>

      <footer className="landing-footer">
   
      </footer>
    </div>
  );
}

export default LandingPage;