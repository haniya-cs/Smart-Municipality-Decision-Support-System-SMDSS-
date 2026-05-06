import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2 } from 'lucide-react';
import { authorizedFetch } from '../../api/apiClient';
import '../../styles/Dashboard.css';

const AdminCitizens = () => {
  const [citizens, setCitizens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: ''
  });
    const handleEditClick = (citizen) => {
    setSelectedCitizen(citizen);
    setFormData({
      email: citizen.email || '',
      phone: citizen.phone || '',
      address: citizen.address || ''
    });
    setIsModalOpen(true);
  };
  //handle update citizen details
  const handleUpdate = async () => {
    try {
      const res = await authorizedFetch(`http://localhost:5000/api/admin/citizens/${selectedCitizen.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updatedList = citizens.map(c =>
          c.user_id === selectedCitizen.user_id
            ? { ...c, ...formData }
            : c
        );
        setCitizens(updatedList);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  // DELETE CITIZEN
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this citizen?")) return;

    try {
      const res = await authorizedFetch(`http://localhost:5000/api/admin/citizens/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setCitizens(citizens.filter(c => c.user_id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };


  useEffect(() => {
    authorizedFetch('http://localhost:5000/api/admin/citizens')
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
        {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ color: 'var(--primary-color)' }}>Edit Citizen</h3>
             <div style={{ marginBottom: '0.5rem' }}>
            <label>Email</label> 
            <input
              className="form-control"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
              </div>
           <div style={{ marginBottom: '0.5rem' }}>
            <label>Phone</label>
            <input
              className="form-control"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            </div>

             <label>Address</label>
            <input
              className="form-control"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={handleUpdate}>
                Save
              </button>
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div className="citizen-welcome" style={{ marginBottom: 0 }}>
          <h1>Citizen Directory</h1>
          <p>Manage registered citizens, update profiles, and monitor activity.</p>
        </div>
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
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto', color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }} title="Edit Details" onClick={() => handleEditClick(citizen)}>
                          <Edit size={16} />
                        </button>
                         <button
                        className="btn btn-outline"
                        style={{ color: '#e11d48', borderColor: '#e11d48' }}
                        onClick={() => handleDelete(citizen.user_id)}
                      >
                        <Trash2 size={16} />
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
 //styles for modal
 const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '1rem',
  
};

const modalBox = {
  backgroundColor: '#ffffff',
  padding: '2rem',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '420px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  maxHeight: '90vh',
  overflowY: 'auto',
  marginBottom: '0.4rem',
  gap: '2rem',
};
export default AdminCitizens;
