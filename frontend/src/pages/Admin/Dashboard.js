import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Users, Map, Zap, CheckCircle2, 
  FileText, Activity, Bell, Shield 
} from 'lucide-react';
import '../../styles/Dashboard.css';
import '../../styles/CitizenLayout.css'; 
import '../../styles/AdminDashboard.css';

/**
 * MOCK DATA
 * Represents the structure expected from the backend API.
 * Defines statistics, complaint clusters, and recent system activities.
 */
const SYSTEM_STATS = [
  { id: 'stat-1', title: 'High Priority', value: '12', trend: '↑ 3 since yesterday', type: 'danger', icon: AlertTriangle },
  { id: 'stat-2', title: 'Pending Issues', value: '48', trend: '15 waiting for review', type: 'warning', icon: Map },
  { id: 'stat-3', title: 'Dues Collected', value: '$45.2K', trend: '↑ +12% this month', type: 'success', icon: CheckCircle2 },
  { id: 'stat-4', title: 'Registered Citizens', value: '1,204', trend: '8 new today', type: 'info', icon: Users }
];

const COMPLAINT_CLUSTERS = [
  { id: 'c-1', title: 'Main water pipe explosion', category: 'Infrastructure', count: 15, priority: 'CRITICAL', status: 'Pending', type: 'danger' },
  { id: 'c-2', title: 'Large pothole on 4th Ave', category: 'Roads', count: 3, priority: 'MEDIUM', status: 'In Progress', type: 'warning' },
  { id: 'c-3', title: 'Streetlight out', category: 'Electricity', count: 1, priority: 'LOW', status: 'Pending', type: 'info' }
];

const RECENT_ACTIVITIES = [
  { id: 'a-1', user: 'LB-1004', action: 'submitted a new complaint.', time: 'Just now', icon: AlertTriangle, colorClass: 'blue' },
  { id: 'a-2', user: 'LB-2041', action: 'paid $45.00 dues.', time: '15 mins ago', icon: CheckCircle2, colorClass: 'green' },
  { id: 'a-3', user: 'System', action: 'New citizen registration pending review.', time: '2 hours ago', icon: Users, colorClass: 'yellow' },
  { id: 'a-4', user: 'System', action: 'Automated backup completed.', time: 'Yesterday', icon: Shield, colorClass: 'gray' }
];

/**
 * SUB-COMPONENTS
 * Abstracting repetitive UI elements into reusable functional components.
 */
const StatCard = ({ stat }) => {
  const Icon = stat.icon;
  return (
    <div className={`dashboard-stat-card admin-stat-card ${stat.type}`}>
      <div className="stat-card-header">
        <div className={`stat-icon-wrapper ${stat.type}`}>
          <Icon size={20} color={stat.type === 'danger' ? '#e11d48' : stat.type === 'warning' ? '#f59e0b' : stat.type === 'success' ? '#10b981' : '#3b82f6'} />
        </div>
        <span className="stat-card-title">{stat.title}</span>
      </div>
      <h2 className="stat-card-value-lg stat-card-value-premium">{stat.value}</h2>
      <p className={`stat-trend ${stat.type}`}>{stat.trend}</p>
    </div>
  );
};

const ClusterRow = ({ cluster }) => (
  <tr className={cluster.priority === 'CRITICAL' ? 'row-critical' : ''}>
    <td>
      <span className={`badge badge-${cluster.type}`}>{cluster.priority}</span>
    </td>
    <td>
      <strong className="cluster-title-main">{cluster.title}</strong>
      <span className={`cluster-subtag ${cluster.priority === 'CRITICAL' ? 'danger' : 'normal'}`}>
        {cluster.category}
      </span>
    </td>
    <td>
      <select className="form-control status-select-sm" defaultValue={cluster.status}>
        <option value="Pending">Pending</option>
        <option value="In Progress">In Progress</option>
        <option value="Resolved">Resolved</option>
      </select>
    </td>
    <td style={{ textAlign: 'center' }}>
      <span className={`count-badge ${cluster.priority === 'CRITICAL' ? 'danger' : 'normal'}`}>
        {cluster.count}
      </span>
    </td>
  </tr>
);

const ActivityItem = ({ activity }) => {
  const Icon = activity.icon;
  return (
    <div className="activity-item">
      <div className={`activity-icon-wrapper ${activity.colorClass}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="activity-text">
          <strong>{activity.user !== 'System' ? activity.user : ''}</strong> {activity.action}
        </p>
        <span className="activity-time">{activity.time}</span>
      </div>
    </div>
  );
};

/**
 * MAIN COMPONENT: AdminDashboard
 * Orchestrates the layout and renders the modularized sub-components.
 */
const AdminDashboard = () => {
  const [chartData] = useState([40, 60, 45, 80, 50, 90, 75]); // Mock weekly resolution data

  return (
    <div className="container fade-in">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-6">
        <div className="citizen-welcome" style={{ marginBottom: 0 }}>
          <h1>Central Admin Dashboard</h1>
          <p>Overview of municipality health and AI-prioritized tasks.</p>
        </div>
        <div className="admin-quick-actions">
          <button className="btn btn-outline admin-action-btn">
            <FileText size={16} /> Export Report
          </button>
          <button className="btn btn-primary admin-action-btn">
            <Bell size={16} /> Broadcast Alert
          </button>
        </div>
      </header>

      {/* Statistics Grid */}
      <section className="dashboard-stats-grid mb-8">
        {SYSTEM_STATS.map(stat => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      {/* Main Dashboard Content - Two Column Grid */}
      <main className="admin-dashboard-grid">
        
        {/* Left Column: Analytics & Review Board */}
        <section className="dashboard-main-content">
          
          {/* Resolution Chart */}
          <div className="dashboard-panel" style={{ marginBottom: '1.5rem' }}>
            <h3 className="panel-title mb-4">
              <Activity size={18} /> Municipality Issue Resolution Rate
            </h3>
            <div className="mockup-chart-container">
              {chartData.map((height, i) => (
                <div key={i} className="mockup-bar-wrapper">
                  <div 
                    className="mockup-bar" 
                    style={{ height: `${height}%`, opacity: i === chartData.length - 1 ? 1 : 0.6 }}
                  />
                </div>
              ))}
            </div>
            <div className="mockup-labels">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Today</span>
            </div>
          </div>

          {/* AI Smart Board */}
          <div className="flex items-center gap-2 mb-4">
            <Zap size={24} color="var(--warning-color)" />
            <h2 className="board-title">Smart Complaints Review Board</h2>
          </div>
          
          <div className="dashboard-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="custom-table smart-board-table">
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th>AI Priority</th>
                  <th>Issue Vector / Cluster</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Reports</th>
                </tr>
              </thead>
              <tbody>
                {COMPLAINT_CLUSTERS.map(cluster => (
                  <ClusterRow key={cluster.id} cluster={cluster} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Live Activity Feed */}
        <aside>
          <div className="dashboard-panel activity-feed-container">
            <h3 className="panel-title mb-4">
              <Activity size={18} /> Live Activity Feed
            </h3>
            <div className="activity-feed-list">
              {RECENT_ACTIVITIES.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
            <button className="btn btn-outline full-log-btn">View Full Audit Log</button>
          </div>
        </aside>

      </main>
    </div>
  );
};

export default AdminDashboard;
