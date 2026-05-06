import React from 'react';
import { User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css'; // Reusing for layout container
import '../styles/RoleSelection.css';

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="container flex justify-center items-center fade-in register-container">
      <div className="glass-panel register-panel text-center">
        <h2 className="title-margin">Choose Your Interface</h2>
        <p className="subtitle" style={{ marginBottom: '2rem' }}>
          Your account is associated with multiple roles. Where would you like to go?
        </p>

        <div className="grid gap-4">
          <button
            className="role-selection-card"
            onClick={() => {
              const currentSession = JSON.parse(localStorage.getItem('smdss_session') || '{}');
              localStorage.setItem('smdss_session', JSON.stringify({ ...currentSession, role: 'citizen' }));
              navigate('/citizen/dashboard');
            }}
          >
            <div className="role-icon citizen-icon">
              <User size={30} color="var(--primary-color)" />
            </div>
            <div className="role-info text-left">
              <h3 style={{ margin: 0 }}>Citizen Portal</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Submit complaints, pay dues, track status</p>
            </div>
          </button>

          <button
            className="role-selection-card"
            onClick={() => {
              const currentSession = JSON.parse(localStorage.getItem('smdss_session') || '{}');
              localStorage.setItem('smdss_session', JSON.stringify({ ...currentSession, role: 'admin' }));
              navigate('/admin/dashboard');
            }}
          >
            <div className="role-icon admin-icon">
              <Shield size={30} color="var(--danger-color)" />
            </div>
            <div className="role-info text-left">
              <h3 style={{ margin: 0 }}>Municipality Admin</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Review AI reports, manage announcements</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
