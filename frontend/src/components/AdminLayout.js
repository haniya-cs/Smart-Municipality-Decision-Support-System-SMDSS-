import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, FileText, Megaphone, Users, LogOut, Building2, CreditCard, UserCog } from 'lucide-react';
import '../styles/CitizenLayout.css'; // Reusing the same beautiful styles

const AdminLayout = () => {
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('smdss_session') || '{}');

  useEffect(() => {
    const hasAdminRole = Array.isArray(session.roles)
      ? session.roles.includes(1)
      : session.role === 'admin';

    if (!session.token || !hasAdminRole) {
      navigate('/guest/login');
    }
  }, [navigate, session.role, session.roles, session.token]);

  const handleSignOut = () => {
    // Basic sign out routine simulation
    localStorage.removeItem('smdss_session');
    navigate('/');
  };

  return (
    <div className="citizen-layout">
      {/* Sidebar Navigation */}
      <aside className="citizen-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-wrapper">
            <Building2 size={24} className="sidebar-logo-icon" />
          </div>
          <div>
            <h2 className="sidebar-title">Admin Portal</h2>
            <p className="sidebar-subtitle">Management</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" className="sidebar-link public-link">
            <Home size={18} />
            Public Site
          </NavLink>

          <div className="nav-section-title">ADMIN CONTROLS</div>

          <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink to="/admin/complaints" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileText size={18} />
            Review Complaints
          </NavLink>

          <NavLink to="/admin/announcements" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Megaphone size={18} />
            Announcements
          </NavLink>

          <NavLink to="/admin/dues" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <CreditCard size={18} />
            Manage Dues
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            Manage Citizens
          </NavLink>

          <NavLink to="/admin/account" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <UserCog size={18} />
            My Account
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar" style={{ backgroundColor: 'var(--danger-color)' }}> {session.full_name ? session.full_name.charAt(0).toUpperCase() : 'A'}</div>
            <div className="user-info">
              <h4 className="user-name">{session.full_name || 'Administrator'}</h4>
              <p className="user-email">{session.email || 'admin@municipality.gov.lb'}</p>
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

export default AdminLayout;
