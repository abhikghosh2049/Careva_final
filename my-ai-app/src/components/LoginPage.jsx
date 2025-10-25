import React, { useState } from 'react';
import { FaUser, FaLock } from 'react-icons/fa6';

function LoginPage({ onLogin, onBack }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && password) {
      onLogin(name);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Enter any details to proceed</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-wrapper">
            <FaUser className="input-icon" />
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-wrapper">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">Login</button>
        </form>
        <button onClick={onBack} className="back-button">Back to Home</button>
      </div>
    </div>
  );
}

export default LoginPage;