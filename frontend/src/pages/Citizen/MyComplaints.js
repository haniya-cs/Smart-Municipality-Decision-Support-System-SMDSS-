import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, FileText } from 'lucide-react';
import '../../styles/CitizenLayout.css';

const MyComplaints = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-header" style={{ marginBottom: '0.25rem' }}>My Complaints</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>0 total complaints</p>
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: 0 }}>No complaints found</p>
        </div>
      </div>
    </div>
  );
};

export default MyComplaints;
