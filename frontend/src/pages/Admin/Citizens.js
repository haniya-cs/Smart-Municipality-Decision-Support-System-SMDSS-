import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Eye, Edit, ShieldAlert } from 'lucide-react';
import '../../styles/Dashboard.css';

const AdminCitizens = () => {
  const [citizens, setCitizens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/citizens')
      .then(res => res.json())
      .then(data => {
        if (data.citizens) setCitizens(data.citizens);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching citizens:", err);
        setIsLoading(false);
      });
  }, []);

  const filteredCitizens = citizens.filter(c => 
    (c.full_name && c.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.citizen_id && c.citizen_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="container fade-in">
      <div className="flex justify-between items-center mb-8">
        <div className="citizen-welcome" style={{ marginBottom: 0 }}>
          <h1>Citizen Directory</h1>
          <p>Manage registered citizens, update profiles, and monitor activity.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
          <UserPlus size={18} style={{ marginRight: '8px', display: 'inline' }} />
          Register Citizen
        </button>
      </div>

      <div className="dashboard-panel" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', color: '#94a3b8' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by Name, Citizen ID, or Phone..." 
              style={{ paddingLeft: '2.5rem', margin: 0, width: '100%', maxWidth: '400px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: '600' }}>Citizen Info</th>
                <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: '600' }}>Contact</th>
                <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: '600' }}>Address</th>
                <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: '600', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading citizens...</td></tr>
              ) : filteredCitizens.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No citizens found matching your search.</td></tr>
              ) : (
                filteredCitizens.map(citizen => (
                  <tr key={citizen.user_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} className="hover-row">
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{ backgroundColor: 'var(--primary-color)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {citizen.full_name ? citizen.full_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <strong style={{ display: 'block', color: '#1e293b' }}>{citizen.full_name || 'N/A'}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{citizen.citizen_id}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.9rem', color: '#334155' }}>{citizen.email || 'No email'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{citizen.phone || 'No phone'}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: '#475569' }}>
                      {citizen.address || 'Not specified'}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span className="badge badge-success">Active</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto' }} title="View 360° Profile">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto', color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }} title="Edit Details">
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto', color: '#e11d48', borderColor: '#e11d48' }} title="Suspend Account">
                          <ShieldAlert size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style>{`
        .hover-row:hover {
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
};

export default AdminCitizens;
