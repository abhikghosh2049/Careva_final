import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import AuthPage from './components/AuthPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// --- NEW: Import the Web3ModalProvider ---
import { Web3ModalProvider } from './WagmiProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* --- NEW: Wrap with Web3ModalProvider --- */}
    <Web3ModalProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public login/signup route */}
            <Route path="/login" element={<AuthPage />} />
            
            {/* Protected main app route */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <App /> 
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </Web3ModalProvider>
  </React.StrictMode>
);