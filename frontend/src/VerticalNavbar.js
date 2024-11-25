import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VerticalNavbar.css';
import { FaBars, FaUser, FaBrain, FaDatabase, FaFlask, FaSignOutAlt } from 'react-icons/fa';

function VerticalNavbar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleLogout = () => {
    navigate('/login'); // Redirect to login
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <nav className={`vertical-navbar ${isExpanded ? 'expanded' : ''}`}>
      <button className="toggle-button" onClick={handleToggle}>
        <FaBars />
      </button>
      <div className="navbar-content">
        <div className="user-info">
          <FaUser className="icon" />
          {isExpanded && <span className="user-name">John Doe</span>}
        </div>
        <ul className="nav-links">
          <li onClick={() => handleNavigation('/main-app')}>
            <FaBrain className="icon" />
            {isExpanded && <span>Brain Segmentation</span>}
          </li>
          <li onClick={() => handleNavigation('/brain-dataset')}>
            <FaDatabase className="icon" />
            {isExpanded && <span>Brain Datasets</span>}
          </li>
          <li onClick={() => handleNavigation('/brain-research')}>
            <FaFlask className="icon" />
            {isExpanded && <span>Brain Research</span>}
          </li>
        </ul>
        <div className="logout" onClick={handleLogout}>
          <FaSignOutAlt className="icon" />
          {isExpanded && <span>Logout</span>}
        </div>
      </div>
    </nav>
  );
}

export default VerticalNavbar;
