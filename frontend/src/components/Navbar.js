import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, User, Menu, X } from 'lucide-react';
import '../styles/Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMenu = () => setIsMobileOpen(!isMobileOpen);
  const closeMenu = () => setIsMobileOpen(false);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <Building2 size={28} className="text-gradient" />
          <span>SMDSS</span>
        </Link>

        {/* Hamburger Icon */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isMobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <div className={`nav-links ${isMobileOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={closeMenu}>Home</Link>
          <Link to="/guest/announcements" className={`nav-link ${location.pathname === '/guest/announcements' ? 'active' : ''}`} onClick={closeMenu}>Announcements</Link>
          <Link to="/guest/register" className={`nav-link ${location.pathname === '/guest/register' ? 'active' : ''}`} onClick={closeMenu}>Register</Link>
          <div className="nav-divider hidden-mobile"></div>
          <Link to="/guest/login" className="btn btn-primary login-btn" onClick={closeMenu}>
            <User size={18} />
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
