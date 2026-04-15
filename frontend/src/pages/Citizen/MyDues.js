import React, { useState } from 'react';
import { CreditCard, Download, FileText, Home, Droplet, Zap, Trash2, Building } from 'lucide-react';
import '../../styles/Dashboard.css';
import '../../styles/MyDues.css';

const MyDues = () => {
  // Simulated multiple properties for the citizen
  const properties = [
    {
      id: "PROP-1001",
      name: "Villa Hamra",
      address: "15 Hamra Street, West District",
      dues: [
        { id: "#INV-W-10", type: "Water", icon: <Droplet size={18}/>, amount: "$45.00", dueDate: "Oct 20, 2026", status: "unpaid" },
        { id: "#INV-E-10", type: "Electricity/Generator", icon: <Zap size={18}/>, amount: "$120.00", dueDate: "Oct 20, 2026", status: "unpaid" },
        { id: "#INV-G-10", type: "Garbage/Cleanliness", icon: <Trash2 size={18}/>, amount: "$15.00", dueDate: "Oct 20, 2026", status: "unpaid" },
        { id: "#INV-T-04", type: "House Dues/Taxes", icon: <Building size={18}/>, amount: "$300.00", dueDate: "Jan 01, 2026", status: "paid" },
      ]
    },
    {
      id: "PROP-1002",
      name: "Apartment Main St",
      address: "Bldg 4, Main Avenue",
      dues: [
        { id: "#INV-W-11", type: "Water", icon: <Droplet size={18}/>, amount: "$22.00", dueDate: "Oct 22, 2026", status: "unpaid" },
        { id: "#INV-E-11", type: "Electricity/Generator", icon: <Zap size={18}/>, amount: "$80.00", dueDate: "Oct 22, 2026", status: "paid" },
        { id: "#INV-G-11", type: "Garbage/Cleanliness", icon: <Trash2 size={18}/>, amount: "$10.00", dueDate: "Oct 22, 2026", status: "unpaid" },
      ]
    }
  ];

  const calculateTotalUnpaid = (dues) => {
    return dues
      .filter(d => d.status === 'unpaid')
      .reduce((sum, d) => sum + parseFloat(d.amount.replace('$', '')), 0)
      .toFixed(2);
  };

  return (
    <div className="container fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-header">Property Dues</h1>
          <p className="page-subtitle">Manage all utility bills, taxes, and service fees across your properties.</p>
        </div>
      </div>

      {properties.map((property, idx) => {
        const totalUnpaid = calculateTotalUnpaid(property.dues);
        
        return (
          <div key={idx} className="property-section mb-8">
            {/* Property Header */}
            <div className="glass-panel property-header-panel mb-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="property-icon-wrapper">
                    <Home size={24} color="var(--primary-color)" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{property.name}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {property.address} • ID: {property.id}
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
                  {property.dues.map((due, dIdx) => (
                    <tr key={dIdx}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText size={16} color="var(--text-muted)" />
                          <span className="invoice-id">{due.id}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {due.icon}
                          <span>{due.type}</span>
                        </div>
                      </td>
                      <td className="date-cell">{due.dueDate}</td>
                      <td className="invoice-amount">{due.amount}</td>
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
