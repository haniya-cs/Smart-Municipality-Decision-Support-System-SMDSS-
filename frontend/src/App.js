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
import Announcements from './pages/Guest/Announcements';

// Citizen Pages
import CitizenDashboard from './pages/Citizen/Dashboard';
import SubmitComplaint from './pages/Citizen/SubmitComplaint';
import MyComplaints from './pages/Citizen/MyComplaints';
import MyDues from './pages/Citizen/MyDues';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';

import CitizenLayout from './components/CitizenLayout';

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
          <Route path="role-selection" element={<RoleSelection />} />
          
          <Route path="admin">
            <Route path="dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Citizen Routes with specialized Sidebar layout */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route path="dashboard" element={<CitizenDashboard />} />
          <Route path="complaint" element={<SubmitComplaint />} />
          <Route path="complaints" element={<MyComplaints />} />
          <Route path="dues" element={<MyDues />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
