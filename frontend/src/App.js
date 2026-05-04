import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import './styles/globals.css';

// Components
import Navbar from './components/Navbar';
import RoleSelection from './components/RoleSelection';
import Footer from './components/Footer';

// Guest Pages
import Home from './pages/Guest/Home';
import Register from './pages/Guest/Register';
import Login from './pages/Guest/Login';
import ForgotPassword from './pages/Guest/ForgotPassword';
import Announcements from './pages/Guest/Announcements';

// Citizen Pages
import CitizenDashboard from './pages/Citizen/Dashboard';
import SubmitComplaint from './pages/Citizen/SubmitComplaint';
import MyComplaints from './pages/Citizen/MyComplaints';
import MyDues from './pages/Citizen/MyDues';
import MyAccount from './pages/Common/MyAccount';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminComplaints from './pages/Admin/Complaints';
import AdminAnnouncements from './pages/Admin/Announcements';
import AdminDues from './pages/Admin/Dues';
import AdminCitizens from './pages/Admin/Citizens';
import ActivityLog from './pages/Admin/ActivityLog';

import CitizenLayout from './components/CitizenLayout';
import AdminLayout from './components/AdminLayout'; // Import Admin Layout

function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1, paddingBottom: '4rem' }}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with standard Navbar & Footer */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="guest/announcements" element={<Announcements />} />
          <Route path="guest/register" element={<Register />} />
          <Route path="guest/login" element={<Login />} />
          <Route path="guest/forgot-password" element={<ForgotPassword />} />
          <Route path="role-selection" element={<RoleSelection />} />
        </Route>

        {/* Citizen Routes with specialized Sidebar layout */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route path="dashboard" element={<CitizenDashboard />} />
          <Route path="complaint" element={<SubmitComplaint />} />
          <Route path="complaints" element={<MyComplaints />} />
          <Route path="dues" element={<MyDues />} />
          <Route path="account" element={<MyAccount roleLabel="Citizen" />} />
        </Route>

        {/* Admin Routes with specialized Sidebar layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="dues" element={<AdminDues />} />
          <Route path="users" element={<AdminCitizens />} />
          <Route path="activity-log" element={<ActivityLog />} />
          <Route path="account" element={<MyAccount roleLabel="Admin" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

