import React from 'react';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';
import '../styles/Footer.css';

// Custom SVGs since lucide-react removed brand icons
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="container footer-grid">
        {/* About Section */}
        <div className="footer-section">
          <div className="logo mb-4" style={{ display: 'inline-flex' }}>
            <Building2 size={28} className="text-gradient" />
            <span>SMDSS</span>
          </div>
          <p className="footer-text">
            Bridging the gap between citizens and city officials toward a smarter, greener, and more efficient municipality.
          </p>
          <div className="social-links mt-4">
            <a href="https://facebook.com/SMDSS.Municipality" target="_blank" rel="noopener noreferrer" className="social-icon">
              <FacebookIcon />
            </a>
            <a href="https://instagram.com/SMDSS.Municipality" target="_blank" rel="noopener noreferrer" className="social-icon">
              <InstagramIcon />
            </a>
            <a href="https://chat.whatsapp.com/invitelink123" target="_blank" rel="noopener noreferrer" className="social-icon">
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section border-left-responsive">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><a href="/guest/login">Citizen Login</a></li>
            <li><a href="/guest/register">Register Property</a></li>
            <li><a href="/guest/announcements">Public Announcements</a></li>
            <li><a href="#">Report an Issue</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section border-left-responsive">
          <h4 className="footer-heading">Contact Us</h4>
          <ul className="footer-contact-list">
            <li>
              <MapPin size={18} className="contact-icon" />
              <span>15 Municipality St., Main District</span>
            </li>
            <li>
              <Phone size={18} className="contact-icon" />
              <span>Hotline: 1515 | Police: 112 | Fire: 175</span>
            </li>
            <li>
              <Mail size={18} className="contact-icon" />
              <span>info@smartmunicipality.gov</span>
            </li>
          </ul>
          <div className="working-hours mt-4">
            <strong>Working Hours:</strong><br />
            Mon-Fri: 8:00 AM - 4:00 PM<br />
            Sat-Sun: Closed
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container flex justify-between items-center flex-wrap gap-4">
          <p className="copyright-text">&copy; 2026 Smart Municipality Decision Support System. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
