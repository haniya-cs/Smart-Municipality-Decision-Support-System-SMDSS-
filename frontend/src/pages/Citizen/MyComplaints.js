import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, FileText } from 'lucide-react';
import '../../styles/CitizenLayout.css';

const MyComplaints = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('smdss_session') || '{}');
    const citizenId = session.citizen_id || 'LB-1004';

    fetch(`http://localhost:5000/api/citizens/${citizenId}/complaints`)
      .then(res => res.json())
      .then(data => {
        if (data.complaints) {
          setComplaints(data.complaints);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch complaints:", err);
        setIsLoading(false);
      });
  }, []);

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || c.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-header" style={{ marginBottom: '0.25rem' }}>My Complaints</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>{complaints.length} total complaints</p>
        </div>
        <Link to="/citizen/complaint" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
          <PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> New Complaint
        </Link>
      </div>

      <div className="dashboard-panel" style={{ padding: '0', marginBottom: '2rem', overflow: 'hidden' }}>
        
        {/* Search header area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: '#94a3b8' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search complaints..." 
              style={{ paddingLeft: '2.5rem', margin: 0, width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={{ width: '200px' }}>
            <select 
              className="form-control" 
              style={{ margin: 0, width: '100%' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading complaints...</div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: 0 }}>No complaints found</p>
          </div>
        ) : (
          <div>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: '600' }}>Description</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(complaint => (
                  <tr key={complaint.complaint_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>#{complaint.complaint_id}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>{complaint.description}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span className={`badge badge-${complaint.status?.toLowerCase() === 'resolved' ? 'success' : complaint.status?.toLowerCase() === 'pending' ? 'warning' : 'primary'}`}>
                        {complaint.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyComplaints;
