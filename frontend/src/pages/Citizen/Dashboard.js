import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, AlertCircle, CheckCircle2, CreditCard, 
  ArrowRight, FileText, PlusCircle, Building, Wallet 
} from 'lucide-react';
import '../../styles/CitizenLayout.css';
import '../../styles/CitizenDashboard.css';

/**
 * MOCK STATS HELPER
 * Used to define the configuration of the statistics cards.
 */
const getStatsConfig = (stats, unpaidTotal) => [
  { id: 's-1', title: 'Pending Complaints', value: stats.pending, type: 'warning', icon: Clock },
  { id: 's-2', title: 'In Progress', value: stats.inProgress, type: 'info', icon: AlertCircle },
  { id: 's-3', title: 'Resolved', value: stats.resolved, type: 'success', icon: CheckCircle2 },
  { id: 's-4', title: 'Unpaid Dues', value: `$${unpaidTotal}`, type: 'danger', icon: CreditCard }
];

/**
 * SUB-COMPONENTS
 */
const StatCard = ({ config }) => {
  const Icon = config.icon;
  return (
    <div className={`dashboard-stat-card citizen-stat-card ${config.type}`}>
      <div className="stat-card-header">
        <div className={`citizen-icon-wrapper ${config.type}`}>
          <Icon size={20} color={
            config.type === 'danger' ? '#e11d48' : 
            config.type === 'warning' ? '#f59e0b' : 
            config.type === 'success' ? '#10b981' : '#3b82f6'
          } />
        </div>
        <span style={{ fontWeight: 600, color: '#475569' }}>{config.title}</span>
      </div>
      <h2 className="stat-card-value-lg" style={{ color: '#0f172a' }}>{config.value}</h2>
    </div>
  );
};

const RecentComplaintItem = ({ complaint }) => {
  const isResolved = complaint.status?.toLowerCase() === 'resolved';
  const isPending = complaint.status?.toLowerCase() === 'pending';
  const statusColor = isResolved ? 'success' : isPending ? 'warning' : 'info';

  return (
    <div className="dashboard-list-item">
      <div className="list-item-content">
        <div className="list-item-title">
          <FileText size={16} color="#64748b" />
          <span>Complaint #{complaint.complaint_id}</span>
          <span className={`badge badge-${statusColor}`} style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
            {complaint.status || 'Pending'}
          </span>
        </div>
        <p className="list-item-desc">{complaint.description}</p>
      </div>
    </div>
  );
};

const DueItem = ({ due }) => (
  <div className="dashboard-list-item">
    <div className="list-item-content">
      <div className="list-item-title">
        <Building size={16} color="#64748b" />
        <span>{due.due_type}</span>
      </div>
      <p className="list-item-desc">Property: {due.property_type}</p>
    </div>
    <div className="list-item-amount">
      ${due.amount}
    </div>
  </div>
);

/**
 * MAIN COMPONENT
 */
const Dashboard = () => {
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [recentDues, setRecentDues] = useState([]);
  const [complaintsStats, setComplaintsStats] = useState({ pending: 0, inProgress: 0, resolved: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [hasProperties, setHasProperties] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const session = JSON.parse(localStorage.getItem('smdss_session') || '{}');
  const citizenId = session.citizen_id || 'LB-1004';
  const firstName = session.full_name ? session.full_name.split(' ')[0] : 'Citizen';

  useEffect(() => {
    // Fetch Dues & Complaints concurrently
    Promise.all([
      fetch(`http://localhost:5000/api/citizens/${citizenId}/dues`).then(res => res.json()).catch(() => ({})),
      fetch(`http://localhost:5000/api/citizens/${citizenId}/complaints`).then(res => res.json()).catch(() => ({}))
    ]).then(([duesData, complaintsData]) => {
      
      // Process Dues
      if (duesData.properties) {
        setHasProperties(duesData.properties.length > 0);
        let total = 0;
        const unpaidItems = [];
        duesData.properties.forEach(property => {
          property.dues.forEach(due => {
            if (due.status === 'unpaid') {
              total += Number(due.amount);
              unpaidItems.push({ due_type: due.type, property_type: property.type, amount: Number(due.amount).toFixed(2) });
            }
          });
        });
        setUnpaidTotal(total.toFixed(2));
        setRecentDues(unpaidItems.slice(0, 3));
      }

      // Process Complaints
      if (complaintsData.complaints) {
        const stats = { pending: 0, inProgress: 0, resolved: 0 };
        complaintsData.complaints.forEach(c => {
           const s = (c.status || '').toLowerCase();
           if (s === 'pending') stats.pending++;
           else if (s === 'in progress') stats.inProgress++;
           else if (s === 'resolved') stats.resolved++;
        });
        setComplaintsStats(stats);
        setRecentComplaints(complaintsData.complaints.slice(0, 4));
      }

      setIsLoading(false);
    });
  }, [citizenId]);

  const statsConfig = getStatsConfig(complaintsStats, unpaidTotal);

  if (isLoading) return <div className="container fade-in" style={{ textAlign: 'center', padding: '5rem' }}>Loading your dashboard...</div>;

  return (
    <div className="container fade-in">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="citizen-welcome" style={{ marginBottom: 0 }}>
          <h1>Welcome back, {firstName}</h1>
          <p>Here's an overview of your municipal services and activities.</p>
        </div>
        <Link to="/citizen/complaint" className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <PlusCircle size={18} /> New Complaint
        </Link>
      </header>

      {/* Stats Grid */}
      <section className="dashboard-stats-grid mb-8">
        {statsConfig.map(config => (
          <StatCard key={config.id} config={config} />
        ))}
      </section>

      {/* Two Column Layout for Panels */}
      <section className="citizen-dashboard-grid">
        
        {/* Recent Complaints Panel */}
        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header-row mb-4">
            <h3 className="panel-title"><FileText size={18} /> Recent Complaints</h3>
            <Link to="/citizen/complaints" className="panel-link">View History <ArrowRight size={16} /></Link>
          </div>

          <div style={{ flex: 1 }}>
            {recentComplaints.length > 0 ? (
              recentComplaints.map(complaint => (
                <RecentComplaintItem key={complaint.complaint_id} complaint={complaint} />
              ))
            ) : (
              <div className="empty-state-container">
                <FileText size={48} strokeWidth={1.5} />
                <p className="empty-state-text">No recent complaints.</p>
                <span style={{ fontSize: '0.85rem' }}>If you face any issue, let the municipality know!</span>
              </div>
            )}
          </div>
        </div>

        {/* Outstanding Dues Panel */}
        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header-row mb-4">
            <h3 className="panel-title"><Wallet size={18} /> Outstanding Dues</h3>
            <Link to="/citizen/dues" className="panel-link">View All <ArrowRight size={16} /></Link>
          </div>

          <div style={{ flex: 1 }}>
            {!hasProperties ? (
              <div className="empty-state-container" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
                <Building size={48} color="#cbd5e1" />
                <p className="empty-state-text" style={{ color: '#64748b' }}>No Properties Found</p>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>You don't have any properties registered.</span>
              </div>
            ) : recentDues.length > 0 ? (
              <>
                {recentDues.map((due, index) => (
                  <DueItem key={index} due={due} />
                ))}
                <button className="btn btn-outline" style={{ width: '100%', marginTop: '1rem', color: '#10b981', borderColor: '#10b981' }}>
                  Proceed to Payment
                </button>
              </>
            ) : (
              <div className="empty-state-container" style={{ borderColor: '#86efac', backgroundColor: '#f0fdf4' }}>
                <CheckCircle2 size={48} color="#10b981" />
                <p className="empty-state-text" style={{ color: '#15803d' }}>All dues are paid!</p>
                <span style={{ fontSize: '0.85rem', color: '#166534' }}>Thank you for your prompt payments.</span>
              </div>
            )}
          </div>
        </div>

      </section>
    </div>
  );
};

export default Dashboard;
