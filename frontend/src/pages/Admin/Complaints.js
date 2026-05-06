import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, CheckCircle2, AlertCircle, Clock, MapPin } from 'lucide-react';
import { authorizedFetch } from '../../api/apiClient';
import '../../styles/Dashboard.css';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagesMap, setImagesMap] = useState({});
  const session = JSON.parse(localStorage.getItem('smdss_session') || '{}');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await authorizedFetch('http://localhost:5000/api/admin/complaints');
      if (!response.ok) throw new Error('Failed to fetch complaints');
      const data = await response.json();
      const complaintsData = data.complaints || [];
      setComplaints(complaintsData);
      //setComplaints(data.complaints || []);
      //fetch images for complaints
       const imagesObject = {};

    await Promise.all(
      complaintsData.map(async (c) => {
        const res = await authorizedFetch(
          `http://localhost:5000/api/complaints/${c.complaint_id}/images`
        );
        const imgData = await res.json();
        imagesObject[c.complaint_id] = imgData.images || [];
      })
    );

    setImagesMap(imagesObject);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await authorizedFetch(`http://localhost:5000/api/admin/complaints/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updated_by: session.user_id || null
        })
      });
      if (!response.ok) throw new Error('Failed to update status');
      
      // Update local state
      setComplaints(prev => prev.map(c => 
        c.complaint_id === id ? { ...c, status: newStatus } : c
      ));
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const getDisplayCategory = (c) =>
    c.category_display_name || c.category_name || 'General';

  const categoryOptions = Array.from(
    new Set(complaints.map((c) => getDisplayCategory(c)))
  ).sort((a, b) => a.localeCompare(b));

  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter((c) => (c.status || '').toLowerCase() === 'pending').length;
  const inProgressCount = complaints.filter((c) => (c.status || '').toLowerCase() === 'in progress').length;
  const resolvedCount = complaints.filter((c) => (c.status || '').toLowerCase() === 'resolved').length;

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.complaint_id).includes(searchTerm);
      
    const matchesStatus = filterStatus === 'all' || (c.status || '').toLowerCase() === filterStatus.toLowerCase();
    const matchesCategory = filterCategory === 'all' || getDisplayCategory(c) === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'resolved') return <span className="badge badge-success">Resolved</span>;
    if (s === 'in progress') return <span className="badge badge-info">In Progress</span>;
    return <span className="badge badge-warning">Pending</span>;
  };

  const getStatusIcon = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'resolved') return <CheckCircle2 size={16} color="var(--success-color)" />;
    if (s === 'in progress') return <Clock size={16} color="var(--primary-color)" />;
    return <AlertCircle size={16} color="var(--warning-color)" />;
  };

  return (
    <div className="container fade-in">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="page-header">Review Complaints</h1>
          <p className="page-subtitle">Manage, review, and update citizen complaints.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="dashboard-stats-grid mb-8">
        <div className="dashboard-stat-card admin-stat-card info">
          <div className="stat-card-title">Total Complaints</div>
          <h2 className="stat-card-value-lg stat-card-value-premium">{totalComplaints}</h2>
        </div>
        <div className="dashboard-stat-card admin-stat-card warning">
          <div className="stat-card-title">Pending</div>
          <h2 className="stat-card-value-lg stat-card-value-premium">{pendingCount}</h2>
        </div>
        <div className="dashboard-stat-card admin-stat-card info">
          <div className="stat-card-title">In Progress</div>
          <h2 className="stat-card-value-lg stat-card-value-premium">{inProgressCount}</h2>
        </div>
        <div className="dashboard-stat-card admin-stat-card success">
          <div className="stat-card-title">Resolved</div>
          <h2 className="stat-card-value-lg stat-card-value-premium">{resolvedCount}</h2>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-panel mb-8" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="search-bar" style={{ flex: '1 1 300px', maxWidth: '500px', position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by ID, Citizen Name, or Description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} color="var(--text-muted)" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-control"
              style={{ width: 'auto', minWidth: '150px' }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-control"
              style={{ width: 'auto', minWidth: '170px' }}
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="glass-panel table-wrapper">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading complaints...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger-color)' }}>{error}</div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state-container" style={{ padding: '4rem 2rem' }}>
            <FileText size={48} color="var(--text-muted)" opacity={0.5} />
            <p className="empty-state-text" style={{ marginTop: '1rem' }}>No complaints found matching your criteria.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Citizen</th>
                <th>Category</th>
                <th>Details</th>
                <th>Images</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map(complaint => (
                <tr key={complaint.complaint_id}>
                  <td style={{ fontWeight: 600 }}>#{complaint.complaint_id}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{complaint.full_name || 'Unknown Citizen'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {complaint.user_citizen_id || complaint.citizen_id}</div>
                  </td>
                  <td>{getDisplayCategory(complaint)}</td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: '1.4', marginBottom: '0.25rem' }}>
                      {complaint.description}
                    </div>
                    {complaint.location && (
                      <div className="flex items-center gap-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <MapPin size={12} /> {complaint.location}
                      </div>
                    )}
                  </td>
                   <td>
                   {imagesMap[complaint.complaint_id]?.length > 0 ? (
                   <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                   {imagesMap[complaint.complaint_id].map(img => (
                    <img
                     key={img.image_id}
                     src={`http://localhost:5000${img.url}`}
                     alt="complaint"
                      onClick={() =>
                       setSelectedImage(`http://localhost:5000${img.url}`)
                      }
                      style={{
                      width: 55,
                      height: 55,
                      objectFit: 'cover',
                      borderRadius: 6,
                      cursor: 'pointer'
                      }}
                  />
                  ))}
                 </div>
                  ) : (
                 <span style={{ color: '#999' }}>No image</span>
                  )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(complaint.status)}
                      {getStatusBadge(complaint.status)}
                    </div>
                  </td>
                  <td>
                    <select 
                      className="form-control" 
                      style={{ fontSize: '0.85rem', padding: '0.4rem', height: 'auto' }}
                      value={(complaint.status || 'Pending')}
                      onChange={(e) => handleUpdateStatus(complaint.complaint_id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Image Modal */}
        {selectedImage && (
  <div
    onClick={() => setSelectedImage(null)}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(255, 255, 255, 0.6)',
      overflowY: 'auto',
      padding: '40px 0',
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 'fit-content',
        maxWidth: '400px',   // makes it small initially
        margin: '0 auto',    // center horizontally only
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        padding: '10px',
      }}
    >
      <img
        src={selectedImage}
        alt="preview"
        style={{
           width: '120%',
            transform: 'scale(1.7)',  
            stransformOrigin: 'center',
            marginTop: '60px',
           borderRadius: '10px',
           display: 'block',
        }}
      />
    </div>
  </div>
)}

    </div>
   

  );
};
 

export default Complaints;
