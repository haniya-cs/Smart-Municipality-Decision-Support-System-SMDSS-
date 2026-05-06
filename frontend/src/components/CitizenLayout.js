import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, FilePlus, FileText, CreditCard, LogOut, Building2, UserCog } from 'lucide-react';
import '../styles/CitizenLayout.css';

const CitizenLayout = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    // Basic sign out routine simulation
    localStorage.removeItem('smdss_session');
    navigate('/');
  };

  const [hasProperties, setHasProperties] = React.useState(false);

  const session = JSON.parse(localStorage.getItem('smdss_session') || '{}');

  useEffect(() => {
    const hasCitizenRole = Array.isArray(session.roles)
      ? session.roles.includes(2)
      : session.role === 'citizen';

    if (!session.token || !hasCitizenRole) {
      navigate('/guest/login');
      return;
    }

    if (session.citizen_id) {
      fetch(`http://localhost:5000/api/citizens/${session.citizen_id}/dues`, {
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.properties) setHasProperties(data.properties.length > 0);
        })
        .catch(err => console.error("Error fetching dues for layout:", err));
    }
  }, [navigate, session.citizen_id, session.role, session.token]);

  return (
    <div className="citizen-layout">
      {/* Sidebar Navigation */}
      <aside className="citizen-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-wrapper">
            <Building2 size={24} className="sidebar-logo-icon" />
          </div>
          <div>
            <h2 className="sidebar-title">Citizen Portal</h2>
            <p className="sidebar-subtitle">My Services</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" className="sidebar-link public-link">
            <Home size={18} />
            Public Site
          </NavLink>

          <div className="nav-section-title">MY SERVICES</div>

          <NavLink to="/citizen/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink to="/citizen/complaint" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FilePlus size={18} />
            New Complaint
          </NavLink>

          <NavLink to="/citizen/complaints" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileText size={18} />
            My Complaints
          </NavLink>

          {hasProperties && (
            <NavLink to="/citizen/dues" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <CreditCard size={18} />
              My Dues
            </NavLink>
          )}

          <NavLink to="/citizen/account" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <UserCog size={18} />
            My Account
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {session.full_name ? session.full_name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="user-info">
              <h4 className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.full_name || 'Citizen'}
              </h4>
              <p className="user-email" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.email || session.citizen_id}
              </p>
            </div>
          </div>
          
          <button className="sign-out-btn" onClick={handleSignOut}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="citizen-main-content">
        <div className="top-padding-bar"></div>
        <Outlet />
      </main>
    </div>
  );
};

export default CitizenLayout;
