import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Login from './Login';
import Signup from './Signup';
import EditAnnotation from './EditAnnotation';
import MainApp from './MainApp';
import PostLogin from './PostLogin';
import BrainResearch from './BrainResearch';
import BrainDataset from './BrainDataset';
import VerticalNavbar from './VerticalNavbar'; // Import the VerticalNavbar component

function AppWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <div className="app-wrapper">
        {/* Vertical Navbar */}
        <VerticalNavbar />

        {/* Main Content */}
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Login onLogin={handleLogin} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/edit-annotation"
              element={isAuthenticated ? <EditAnnotation /> : <Navigate to="/login" />}
            />
            <Route path="/main-app" element={<MainApp />} />
            <Route path="/post-login" element={<PostLogin />} /> {/* New page with buttons */}
            <Route path="/brain-research" element={<BrainResearch />} />
            <Route path="/brain-dataset" element={<BrainDataset />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default AppWrapper;
