import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import AuthPage from './components/AuthPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Import your main CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
  </React.StrictMode>
);