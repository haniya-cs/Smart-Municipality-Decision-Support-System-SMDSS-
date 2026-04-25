import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2, CreditCard, ArrowRight, FileText, PlusCircle } from 'lucide-react';
import '../../styles/CitizenLayout.css';

const Dashboard = () => {
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [recentDues, setRecentDues] = useState([]);
  const [complaintsStats, setComplaintsStats] = useState({ pending: 0, inProgress: 0, resolved: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  
  // Get the session from local storage to find the logged-in citizen_id
  const session = JSON.parse(localStorage.getItem('smdss_session') || '{}');
  const citizenId = session.citizen_id || 'LB-1004'; // Default to Rania if no session

  useEffect(() => {
    // Fetch dues
    fetch(`http://localhost:5000/api/citizens/${citizenId}/dues`)
      .then(res => res.json())
      .then(data => {
        if (data.properties) {
          let total = 0;
          const unpaidItems = [];
          
          data.properties.forEach(property => {
            property.dues.forEach(due => {
              if (due.status === 'unpaid') {
                total += Number(due.amount);
                unpaidItems.push({
                  due_type: due.type,
                  property_type: property.type,
                  amount: Number(due.amount).toFixed(2)
                });
              }
            });
          });
          
          setUnpaidTotal(total.toFixed(2));
          setRecentDues(unpaidItems.slice(0, 3));
        }
      })
      .catch(err => console.error("Error fetching dues:", err));

    // Fetch complaints
    fetch(`http://localhost:5000/api/citizens/${citizenId}/complaints`)
      .then(res => res.json())
      .then(data => {
        if (data.complaints) {
          const stats = { pending: 0, inProgress: 0, resolved: 0 };
          data.complaints.forEach(c => {
             const s = (c.status || '').toLowerCase();
             if (s === 'pending') stats.pending++;
             else if (s === 'in progress') stats.inProgress++;
             else if (s === 'resolved') stats.resolved++;
          });
          setComplaintsStats(stats);
          setRecentComplaints(data.complaints.slice(0, 3));
        }
      })
      .catch(err => console.error("Error fetching complaints:", err));
  }, [citizenId]);

  return (
    <div className="fade-in">
      <div className="citizen-welcome">
        <h1>Welcome back, {session.full_name ? session.full_name.split(' ')[0] : 'Rania'}</h1>
        <p>Here's an overview of your municipal services.</p>
      </div>

      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="stat-card-header">
            <Clock size={16} color="#f59e0b" />
            <span>Pending</span>
          </div>
          <h2 className="stat-card-value-lg">{complaintsStats.pending}</h2>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-card-header">
            <AlertCircle size={16} color="#3b82f6" />
            <span>In Progress</span>
          </div>
          <h2 className="stat-card-value-lg">{complaintsStats.inProgress}</h2>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-card-header">
            <CheckCircle2 size={16} color="#10b981" />
            <span>Resolved</span>
          </div>
          <h2 className="stat-card-value-lg">{complaintsStats.resolved}</h2>
        </div>

        <div className="dashboard-stat-card red-bg">
          <div className="stat-card-header red-text">
            <CreditCard size={16} color="#e11d48" />
            <span>Unpaid Dues</span>
          </div>
          <h2 className="stat-card-value-lg red-text">${unpaidTotal}</h2>
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

          {recentComplaints.length > 0 ? (
            <div style={{ marginTop: '15px' }}>
              {recentComplaints.map(complaint => (
                <div key={complaint.complaint_id} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                      #{complaint.complaint_id}
                    </strong>
                    <span className={`badge badge-${complaint.status?.toLowerCase() === 'resolved' ? 'success' : complaint.status?.toLowerCase() === 'pending' ? 'warning' : 'primary'}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                      {complaint.status || 'Pending'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {complaint.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-empty-state">
              <FileText size={48} color="#e2e8f0" strokeWidth={1} />
              <p className="panel-empty-text">No complaints yet</p>
            </div>
          )}

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

          {unpaidTotal > 0 ? (
            <div style={{ marginTop: '15px' }}>
              {recentDues.map((due, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>{due.due_type}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Property: {due.property_type}</span>
                  </div>
                  <div style={{ color: '#e11d48', fontWeight: 'bold' }}>
                    ${due.amount}
                  </div>
                </div>
              ))}
              <Link to="/citizen/dues" style={{ display: 'block', textAlign: 'center', marginTop: '15px', color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }}>
                Pay Now
              </Link>
            </div>
          ) : (
            <div className="panel-empty-state">
              <CheckCircle2 size={48} color="#10b981" />
              <p className="panel-empty-text success-state">All dues are paid!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
