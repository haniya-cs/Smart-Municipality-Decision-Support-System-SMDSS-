import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Shield, Users } from 'lucide-react';
import { authorizedFetch } from '../../api/apiClient';
import '../../styles/Dashboard.css';

const getRelativeTime = (inputDate) => {
  const time = new Date(inputDate).getTime();
  if (Number.isNaN(time)) return 'Just now';
  const diffSec = Math.floor((Date.now() - time) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
};

const activityTypeMeta = {
  complaint_submitted: { icon: AlertTriangle, colorClass: 'blue' },
  citizen_registered: { icon: Users, colorClass: 'yellow' },
  complaint_status_changed: { icon: CheckCircle2, colorClass: 'green' },
  due_paid: { icon: CheckCircle2, colorClass: 'green' },
  dues_paid_bulk: { icon: CheckCircle2, colorClass: 'green' }
};

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId;

    const fetchActivities = async () => {
      try {
        const response = await authorizedFetch('http://localhost:5000/api/admin/live-activities?limit=500&days=2');
        if (!response.ok) throw new Error('Failed to fetch activity log');
        const data = await response.json();
        setActivities(Array.isArray(data.activities) ? data.activities : []);
        setTotal(Number(data.pagination?.total || 0));
      } catch (error) {
        console.error('Activity log fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    intervalId = setInterval(fetchActivities, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const formatDateTime = (inputDate) => {
    const d = new Date(inputDate);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  };

  return (
    <div className="container fade-in">
      <header className="mb-6">
        <h1 className="page-header">Full Audit Log</h1>
        <p className="page-subtitle">Complete live activity stream across complaints, dues, and registrations.</p>
      </header>

      <div className="glass-panel table-wrapper">
        {loading ? (
          <div style={{ padding: '1.5rem' }}>Loading activity log...</div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '1.5rem' }}>No activity in the last 2 days.</div>
        ) : (
          <div className="activity-feed-list">
            {activities.map((item) => {
              const meta = activityTypeMeta[item.activity_type] || { icon: Activity, colorClass: 'gray' };
              const Icon = meta.icon;
              return (
                <div key={item.activity_id} className="activity-item" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div className={`activity-icon-wrapper ${meta.colorClass}`}>
                    <Icon size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="activity-text" style={{ marginBottom: '0.2rem' }}>
                      <strong>{item.actor_citizen_id || 'System'}</strong> {item.action_text}
                    </p>
                    <span className="activity-time">
                      {getRelativeTime(item.created_at)} • {formatDateTime(item.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <span style={{ color: 'var(--text-muted)' }}>
            Showing {activities.length} of {total} activities (last 2 days)
          </span>
        </div>
      </div>

      <div className="glass-panel mt-4" style={{ padding: '0.85rem 1rem' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Shield size={16} />
          Auto-refresh runs every 10 seconds.
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
