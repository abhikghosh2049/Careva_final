import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css'; // Create this file and copy style.css content into it

function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password === '') { return setError('Please enter a password.'); }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/'); // Navigate to main app
    } catch (err) {
      setError('Failed to sign in. Check your email and password.');
      console.error("Login Error:", err);
    }
    setLoading(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (password.length < 6) {
      return setError('Password should be at least 6 characters.');
    }
    
    try {
      setLoading(true);
      await signup(email, password, name);
      navigate('/'); // Navigate to main app after signup
    } catch (err) {
      setError('Failed to create an account.');
       if (err.code === 'auth/email-already-in-use') {
            setError('This email address is already registered.');
       }
      console.error("Signup Error:", err);
    }
    setLoading(false);
  };

  // --- Return JSX based on CarevaFrontend-main/public/index.html ---
  // This is a simplified conversion. You'll need to copy/paste the full HTML
  // and convert 'class' to 'className', 'for' to 'htmlFor', etc.
  
  return (
    <div className="login-container">
      {/* Splash Panel (optional, for desktop) */}
      <div className="splash-panel">
         <h1>CAREVA</h1>
         <p>All your healthcare need on your finger tips</p>
      </div>

      <div className="login-panel">
        {isLoginView ? (
          /* --- Login View --- */
          <div className="login-content form-content" id="login-view">
            <h2>Welcome User</h2>
            <p className="subtitle">Sign in to continue</p>
            {error && <p className="notification-error">{error}</p>}
            <form id="login-form" onSubmit={handleLoginSubmit}>
              <div className="input-group">
                <label>EMAIL</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>PASSWORD</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-action" disabled={loading}>
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </form>
            <a href="#" className="toggle-link" onClick={(e) => { e.preventDefault(); setIsLoginView(false); setError(''); }}>
              Need an account? Sign Up
            </a>
          </div>
        ) : (
          /* --- Signup View --- */
          <div className="signup-content form-content" id="signup-view">
            <h2>Create Account</h2>
            <p className="subtitle">Enter your details below</p>
             {error && <p className="notification-error">{error}</p>}
            <form id="signup-form" onSubmit={handleSignupSubmit}>
              <div className="input-group">
                <label>NAME</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>EMAIL</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>PASSWORD</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>CONFIRM PASSWORD</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-action" disabled={loading}>
                 {loading ? 'CREATING...' : 'SIGN UP'}
              </button>
            </form>
            <a href="#" className="toggle-link" onClick={(e) => { e.preventDefault(); setIsLoginView(true); setError(''); }}>
              Already have an account? Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthPage;