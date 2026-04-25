import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Download, FileText, Home, Droplet, Zap, Trash2, Building } from 'lucide-react';
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
        const response = await fetch(`http://localhost:5000/api/citizens/${session.citizen_id}/dues`);
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

  return (
    <div className="container fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-header">Property Dues</h1>
          <p className="page-subtitle">Manage all utility bills, taxes, and service fees across your properties.</p>
        </div>
      </div>

      {isLoading && <p>Loading dues...</p>}
      {!isLoading && error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}
      {!isLoading && !error && properties.length === 0 && (
        <div className="glass-panel">
          <p style={{ margin: 0 }}>No property dues found. Citizens without properties do not have dues.</p>
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
                    <button className="btn btn-primary">
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
                          <button className="btn btn-outline invoice-pay-btn" style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}>Pay</button>
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
