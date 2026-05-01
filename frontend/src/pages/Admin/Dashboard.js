import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Users, Map, Zap, CheckCircle2,
  Activity, Shield
} from 'lucide-react';
import '../../styles/Dashboard.css';
import '../../styles/CitizenLayout.css'; 
import '../../styles/AdminDashboard.css';

const formatCurrencyCompact = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(Number(amount || 0));

const COMPLAINT_CLUSTERS = [
  { id: 'c-1', title: 'Main water pipe explosion', category: 'Infrastructure', count: 15, priority: 'CRITICAL', status: 'Pending', type: 'danger' },
  { id: 'c-2', title: 'Large pothole on 4th Ave', category: 'Roads', count: 3, priority: 'MEDIUM', status: 'In Progress', type: 'warning' },
  { id: 'c-3', title: 'Streetlight out', category: 'Electricity', count: 1, priority: 'LOW', status: 'Pending', type: 'info' }
];

const getRelativeTime = (inputDate) => {
  const time = new Date(inputDate).getTime();
  if (Number.isNaN(time)) return 'Just now';
  const diffSec = Math.floor((Date.now() - time) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
};

const activityTypeMeta = {
  complaint_submitted: { icon: AlertTriangle, colorClass: 'blue' },
  citizen_registered: { icon: Users, colorClass: 'yellow' },
  complaint_status_changed: { icon: CheckCircle2, colorClass: 'green' }
};

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
  const [stats, setStats] = useState({
    high_priority: 0,
    pending_issues: 0,
    dues_collected: 0,
    registered_citizens: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/dashboard-stats');
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        const data = await response.json();
        setStats({
          high_priority: Number(data.high_priority || 0),
          pending_issues: Number(data.pending_issues || 0),
          dues_collected: Number(data.dues_collected || 0),
          registered_citizens: Number(data.registered_citizens || 0)
        });
      } catch (err) {
        console.error('Dashboard stats fetch error:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    let intervalId;

    const fetchActivities = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/live-activities?limit=12');
        if (!response.ok) throw new Error('Failed to fetch live activities');
        const data = await response.json();
        setActivities(Array.isArray(data.activities) ? data.activities : []);
      } catch (error) {
        console.error('Live activities fetch error:', error);
      }
    };

    fetchActivities();
    intervalId = setInterval(fetchActivities, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const systemStats = [
    {
      id: 'stat-1',
      title: 'High Priority',
      value: isLoadingStats ? '...' : stats.high_priority.toLocaleString(),
      trend: `${stats.high_priority} unresolved high-priority complaints`,
      type: 'danger',
      icon: AlertTriangle
    },
    {
      id: 'stat-2',
      title: 'Pending Issues',
      value: isLoadingStats ? '...' : stats.pending_issues.toLocaleString(),
      trend: `${stats.pending_issues} waiting for review`,
      type: 'warning',
      icon: Map
    },
    {
      id: 'stat-3',
      title: 'Dues Collected',
      value: isLoadingStats ? '...' : formatCurrencyCompact(stats.dues_collected),
      trend: 'Total paid dues so far',
      type: 'success',
      icon: CheckCircle2
    },
    {
      id: 'stat-4',
      title: 'Registered Citizens',
      value: isLoadingStats ? '...' : stats.registered_citizens.toLocaleString(),
      trend: 'Total active citizens in system',
      type: 'info',
      icon: Users
    }
  ];

  return (
    <div className="container fade-in">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-6">
        <div className="citizen-welcome" style={{ marginBottom: 0 }}>
          <h1>Central Admin Dashboard</h1>
          <p>Overview of municipality health and AI-prioritized tasks.</p>
        </div>
      </header>

      {/* Statistics Grid */}
      <section className="dashboard-stats-grid mb-8">
        {systemStats.map(stat => (
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
              {activities.length === 0 ? (
                <div className="activity-item">
                  <div className="activity-icon-wrapper gray">
                    <Shield size={16} />
                  </div>
                  <div>
                    <p className="activity-text">No activity yet.</p>
                    <span className="activity-time">Waiting for updates...</span>
                  </div>
                </div>
              ) : (
                activities.map((item) => {
                  const meta = activityTypeMeta[item.activity_type] || { icon: Activity, colorClass: 'gray' };
                  const activity = {
                    id: item.activity_id,
                    user: item.actor_citizen_id || 'System',
                    action: item.action_text,
                    time: getRelativeTime(item.created_at),
                    icon: meta.icon,
                    colorClass: meta.colorClass
                  };
                  return <ActivityItem key={activity.id} activity={activity} />;
                })
              )}
            </div>
            <button className="btn btn-outline full-log-btn">View Full Audit Log</button>
          </div>
        </aside>

      </main>
    </div>
  );
};

export default AdminDashboard;
