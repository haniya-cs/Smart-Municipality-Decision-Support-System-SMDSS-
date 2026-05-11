import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Download, FileText, Home, Droplet, Zap, Trash2, Building } from 'lucide-react';
import { authorizedFetch } from '../../api/apiClient';
import '../../styles/Dashboard.css';
import '../../styles/MyDues.css';

const MyDues = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const session = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('smdss_session') || '{}');
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    const loadDues = async () => {
      if (!session.citizen_id) {
        setError('No citizen session found. Please login again.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await authorizedFetch(`${process.env.REACT_APP_API_BASE_URL}/api/citizens/${session.citizen_id}/dues`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load dues.');
          return;
        }

        setProperties(data.properties || []);
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDues();
  }, [session.citizen_id]);

  const getTypeIcon = (type) => {
    const normalized = (type || '').toLowerCase();
    if (normalized.includes('water')) return <Droplet size={18} />;
    if (normalized.includes('electric')) return <Zap size={18} />;
    if (normalized.includes('garbage') || normalized.includes('clean')) return <Trash2 size={18} />;
    return <Building size={18} />;
  };

  const formatDate = (rawDate) => {
    if (!rawDate) return '-';
    return new Date(rawDate).toLocaleDateString();
  };

  const calculateTotalUnpaid = (dues = []) =>
    dues
      .filter((d) => d.status === 'unpaid')
      .reduce((sum, d) => sum + Number(d.amount), 0)
      .toFixed(2);

  const handlePayDue = async (dueId) => {
    try {
      const response = await authorizedFetch(`${process.env.REACT_APP_API_BASE_URL}/api/dues/${dueId}/pay`, { method: 'PUT' });
      if (response.ok) {
        // Update local state to reflect the paid status
        setProperties(prev => prev.map(property => ({
          ...property,
          dues: property.dues.map(due => due.due_id === dueId ? { ...due, status: 'paid' } : due)
        })));
        alert('Payment successful!');
      } else {
        alert('Failed to process payment.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred during payment.');
    }
  };

  const handlePayTotal = async (propertyId) => {
    try {
      const response = await authorizedFetch(`${process.env.REACT_APP_API_BASE_URL}/api/properties/${propertyId}/pay-all`, { method: 'PUT' });
      if (response.ok) {
        // Update all unpaid dues for this property to paid
        setProperties(prev => prev.map(property => {
          if (property.property_id === propertyId) {
            return {
              ...property,
              dues: property.dues.map(due => ({ ...due, status: 'paid' }))
            };
          }
          return property;
        }));
        alert('All outstanding dues for this property have been paid!');
      } else {
        alert('Failed to process total payment.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred during total payment.');
    }
  };

  return (
    <div className="container fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-header">Property Dues</h1>
          <p className="page-subtitle">Manage all utility bills, taxes, and service fees across your properties.</p>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
          Loading your property dues...
        </div>
      )}
      {!isLoading && error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}
      {!isLoading && !error && properties.length === 0 && (
        <div className="empty-state-container" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc', padding: '4rem 2rem' }}>
          <Building size={48} color="#cbd5e1" strokeWidth={1.5} />
          <h3 style={{ marginTop: '1rem', color: '#475569', fontWeight: 600 }}>No Properties Found</h3>
          <p className="empty-state-text" style={{ color: '#64748b', maxWidth: '400px', margin: '0.5rem auto 0' }}>
            You currently do not have any properties registered under your name in this municipality. Therefore, no municipal dues or utility bills apply to you.
          </p>
        </div>
      )}

      {!isLoading && !error && properties.map((property) => {
        const totalUnpaid = calculateTotalUnpaid(property.dues);
        
        return (
          <div key={property.property_id} className="property-section mb-8">
            {/* Property Header */}
            <div className="glass-panel property-header-panel mb-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="property-icon-wrapper">
                    <Home size={24} color="var(--primary-color)" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{property.type || 'Property'}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {property.location || 'No location set'} • ID: {property.property_id}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Outstanding Balance</p>
                    <h3 style={{ margin: 0, color: totalUnpaid > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                      ${totalUnpaid}
                    </h3>
                  </div>
                  {totalUnpaid > 0 && (
                    <button className="btn btn-primary" onClick={() => handlePayTotal(property.property_id)}>
                      <CreditCard size={18} /> Pay Total
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dues Table for this property */}
            <div className="glass-panel table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Type</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {property.dues.map((due) => (
                    <tr key={due.due_id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText size={16} color="var(--text-muted)" />
                          <span className="invoice-id">#{due.due_id}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(due.type)}
                          <span>{due.type}</span>
                        </div>
                      </td>
                      <td className="date-cell">{formatDate(due.due_date)}</td>
                      <td className="invoice-amount">${Number(due.amount).toFixed(2)}</td>
                      <td>
                        {due.status === 'unpaid' ? (
                          <span className="badge badge-warning">Unpaid</span>
                        ) : (
                          <span className="badge badge-success">Paid</span>
                        )}
                      </td>
                      <td className="text-right">
                        {due.status === 'unpaid' ? (
                          <button 
                            className="btn btn-outline invoice-pay-btn" 
                            style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                            onClick={() => handlePayDue(due.due_id)}
                          >
                            Pay
                          </button>
                        ) : (
                          <button className="btn invoice-download-btn">
                            <Download size={16} /> Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyDues;
