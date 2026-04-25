import React, { useState } from 'react';
import { CreditCard, PlusCircle, Search } from 'lucide-react';
import '../../styles/Dashboard.css';

const AdminDues = () => {
  return (
    <div className="container fade-in">
      <div className="citizen-welcome mb-8">
        <h1>Manage Municipal Dues</h1>
        <p>Assign and control taxes, utility bills, and service fees for citizens' properties.</p>
      </div>

      {/* Assign New Due Section */}
      <div className="flex items-center gap-2 mb-4">
        <PlusCircle size={24} color="var(--primary-color)" />
        <h2 className="board-title">Assign New Due / Bill</h2>
      </div>

      <div className="glass-panel text-left">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid md:grid-cols-2 gap-4">
            
            <div className="form-group mb-0">
              <label className="form-label">Search Citizen ID</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" className="form-control" placeholder="E.g., LB-1001" style={{ flex: 1 }} />
                <button type="button" className="btn btn-outline" style={{ padding: '0 15px' }}><Search size={18} /></button>
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Select Citizen's Property</label>
              <select className="form-control">
                <option value="">-- Please search citizen first --</option>
                <option value="1">Property ID 1: Apartment (Bldg 4, Main Ave)</option>
                <option value="2">Property ID 2: Villa (15 Hamra St)</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Due / Bill Type</label>
              <select className="form-control">
                <option value="Water">Water Bill</option>
                <option value="Electricity">Electricity / Generator</option>
                <option value="Garbage">Garbage / Cleanliness Fee</option>
                <option value="House Dues">Annual House Tax</option>
                <option value="Permit">Permit / Licensing Fee</option>
                <option value="Other">Other Penalty / Fee</option>
              </select>
            </div>
            
            <div className="form-group mb-0">
              <label className="form-label">Amount ($)</label>
              <input type="number" step="0.01" className="form-control" placeholder="0.00" />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Due Date (Deadline)</label>
              <input type="date" className="form-control" />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Initial Status</label>
              <select className="form-control">
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="form-group mt-4">
            <label className="form-label">Description / Notes</label>
            <textarea className="form-control" rows="2" placeholder="E.g., Water bill for the month of May 2026..."></textarea>
          </div>

          <div className="flex justify-end mt-4">
            <button type="submit" className="btn btn-primary">
              <CreditCard size={18} style={{ marginRight: '8px', display: 'inline' }}/>
              Assign Due to Property
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default AdminDues;
