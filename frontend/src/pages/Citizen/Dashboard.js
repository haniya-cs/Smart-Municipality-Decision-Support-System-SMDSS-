import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2, CreditCard, ArrowRight, FileText, PlusCircle } from 'lucide-react';
import '../../styles/CitizenLayout.css';

const Dashboard = () => {
  return (
    <div className="fade-in">
      <div className="citizen-welcome">
        <h1>Welcome back, Rania</h1>
        <p>Here's an overview of your municipal services.</p>
      </div>

      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="stat-card-header">
            <Clock size={16} color="#f59e0b" />
            <span>Pending</span>
          </div>
          <h2 className="stat-card-value-lg">0</h2>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-card-header">
            <AlertCircle size={16} color="#3b82f6" />
            <span>In Progress</span>
          </div>
          <h2 className="stat-card-value-lg">0</h2>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-card-header">
            <CheckCircle2 size={16} color="#10b981" />
            <span>Resolved</span>
          </div>
          <h2 className="stat-card-value-lg">0</h2>
        </div>

        <div className="dashboard-stat-card red-bg">
          <div className="stat-card-header red-text">
            <CreditCard size={16} color="#e11d48" />
            <span>Unpaid Dues</span>
          </div>
          <h2 className="stat-card-value-lg red-text">$0</h2>
        </div>
      </div>

      <div className="dashboard-panels-grid">
        {/* Recent Complaints Panel */}
        <div className="dashboard-panel">
          <div className="panel-header-row">
            <h3 className="panel-title">
              <FileText size={18} />
              Recent Complaints
            </h3>
            <Link to="/citizen/complaints" className="panel-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="panel-empty-state">
            <FileText size={48} color="#e2e8f0" strokeWidth={1} />
            <p className="panel-empty-text">No complaints yet</p>
          </div>

          <Link to="/citizen/complaint" className="btn btn-teal mt-auto">
            <PlusCircle size={18} /> Submit New Complaint
          </Link>
        </div>

        {/* Outstanding Dues Panel */}
        <div className="dashboard-panel">
          <div className="panel-header-row">
            <h3 className="panel-title">
              <CreditCard size={18} />
              Outstanding Dues
            </h3>
            <Link to="/citizen/dues" className="panel-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="panel-empty-state">
            <CheckCircle2 size={48} color="#10b981" />
            <p className="panel-empty-text success-state">All dues are paid!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
