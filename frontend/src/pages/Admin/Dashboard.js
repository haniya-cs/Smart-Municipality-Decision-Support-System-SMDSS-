import React from 'react';
import { AlertTriangle, Users, Map, MoreVertical, Zap } from 'lucide-react';
import '../../styles/Dashboard.css';

const AdminDashboard = () => {
  return (
    <div className="container fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="page-header">Central Admin Dashboard</h1>
          <p className="page-subtitle">Overview of municipality health and AI-prioritized tasks</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel stat-panel-padding">
          <div className="flex justify-between items-center mb-2">
            <h5 className="stat-card-title">High Priority</h5>
            <AlertTriangle size={18} color="var(--danger-color)" />
          </div>
          <h2 className="stat-danger-value">12</h2>
        </div>
        
        <div className="glass-panel stat-panel-padding">
          <div className="flex justify-between items-center mb-2">
            <h5 className="stat-card-title">Pending Issues</h5>
            <Map size={18} color="var(--warning-color)" />
          </div>
          <h2 className="stat-normal-value">48</h2>
        </div>

        <div className="glass-panel stat-panel-padding">
          <div className="flex justify-between items-center mb-2">
            <h5 className="stat-card-title">Dues Collected</h5>
            <span className="stat-success-label">$</span>
          </div>
          <h2 className="stat-normal-value">$45K</h2>
        </div>
        
        <div className="glass-panel stat-panel-padding">
          <div className="flex justify-between items-center mb-2">
            <h5 className="stat-card-title">Registered Citizens</h5>
            <Users size={18} color="var(--primary-color)" />
          </div>
          <h2 className="stat-normal-value">1,204</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Zap size={24} color="var(--warning-color)" />
        <h2 className="board-title">Smart Complaints Review Board</h2>
      </div>
      <p className="board-subtitle">AI has clustered duplicate reports and re-ordered this list by true priority and severity.</p>

      <div className="glass-panel table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>AI Priority</th>
              <th>Issue Vector / Cluster</th>
              <th>Category</th>
              <th>Status</th>
              <th>Reports Count</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {/* High Priority Cluster */}
            <tr className="priority-high-row">
              <td>
                <span className="badge badge-danger">CRITICAL</span>
              </td>
              <td>
                <div className="cluster-title">Main water pipe explosion</div>
                <div className="cluster-keywords-danger">Keywords: "danger", "flood", "explosion"</div>
              </td>
              <td className="cluster-category">Infrastructure</td>
              <td>
                <select className="form-control status-select">
                  <option value="pending">Pending</option>
                  <option value="progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </td>
              <td>
                <span className="badge cluster-count-badge">15 Duplicates clustered</span>
              </td>
              <td className="text-right">
                <button className="btn btn-outline action-btn"><MoreVertical size={16}/></button>
              </td>
            </tr>

            {/* Medium Priority */}
            <tr>
              <td>
                <span className="badge badge-warning">MEDIUM</span>
              </td>
              <td>
                <div className="cluster-title">Large pothole on 4th Ave</div>
                <div className="cluster-keywords-normal">Keywords: "car damage", "deep hole"</div>
              </td>
              <td className="cluster-category">Roads</td>
              <td>
                <select className="form-control status-select">
                  <option value="pending">Pending</option>
                  <option value="progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </td>
              <td>
                <span className="badge cluster-count-badge">3 Reports clustered</span>
              </td>
              <td className="text-right">
                <button className="btn btn-outline action-btn"><MoreVertical size={16}/></button>
              </td>
            </tr>

            {/* Low Priority */}
            <tr>
              <td>
                <span className="badge badge-info">LOW</span>
              </td>
              <td>
                <div className="cluster-title">Streetlight out</div>
                <div className="cluster-keywords-normal">Keywords: "dark", "broken light"</div>
              </td>
              <td className="cluster-category">Electricity</td>
              <td>
                <select className="form-control status-select">
                  <option value="pending">Pending</option>
                  <option value="progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </td>
              <td>
                <span className="cluster-count-text">Unique report</span>
              </td>
              <td className="text-right">
                <button className="btn btn-outline action-btn"><MoreVertical size={16}/></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Post New Announcement Section */}
      <div className="flex items-center gap-2 mb-4 mt-8">
        <AlertTriangle size={24} color="var(--primary-color)" />
        <h2 className="board-title">Publish New Announcement</h2>
      </div>
      <p className="board-subtitle">Create and publish public announcements to be displayed on the Guest and Citizen portals.</p>

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

export default AdminDashboard;
