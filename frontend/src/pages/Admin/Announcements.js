import React from 'react';
import { AlertTriangle, PlusCircle } from 'lucide-react';
import '../../styles/Dashboard.css';

const AdminAnnouncements = () => {
  return (
    <div className="container fade-in">
      <div className="citizen-welcome mb-8">
        <h1>Announcements Management</h1>
        <p>Create and publish public announcements to be displayed on the Guest and Citizen portals.</p>
      </div>

      {/* Post New Announcement Section */}
      <div className="flex items-center gap-2 mb-4">
        <PlusCircle size={24} color="var(--primary-color)" />
        <h2 className="board-title">Publish New Announcement</h2>
      </div>

      <div className="glass-panel text-left">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Announcement Title</label>
              <input type="text" className="form-control" placeholder="E.g., Water Cut in West District" />
            </div>
            
            <div className="form-group mb-0">
              <label className="form-label">Announcement Type</label>
              <select className="form-control">
                <option value="urgent">Urgent / Alert (طوارئ)</option>
                <option value="event">Event / Festival (فعاليات ومهرجانات)</option>
                <option value="general">General Info / Ads (إعلانات عامة)</option>
                <option value="meeting">Meeting / Hearing (جلسات واجتماعات)</option>
                <option value="maintenance">Scheduled Maintenance (صيانة مجدولة)</option>
              </select>
            </div>
            
            <div className="form-group mb-0">
              <label className="form-label">Publish Start Date</label>
              <input type="datetime-local" className="form-control" />
            </div>
            
            <div className="form-group mb-0">
              <label className="form-label">Publish End Date (Expiry)</label>
              <input type="datetime-local" className="form-control" />
            </div>
          </div>

          <div className="form-group mt-4">
            <label className="form-label">Announcement Content</label>
            <textarea className="form-control" rows="4" placeholder="Detailed description of the announcement..."></textarea>
          </div>

          <div className="form-group mt-4">
            <label className="form-label">Upload Image (Optional)</label>
            <input type="file" className="form-control" accept="image/*" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }} />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Accepted formats: JPG, PNG, GIF. Max size: 5MB.</small>
          </div>

          <div className="flex justify-end mt-4">
            <button type="submit" className="btn btn-primary">
              Publish Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
