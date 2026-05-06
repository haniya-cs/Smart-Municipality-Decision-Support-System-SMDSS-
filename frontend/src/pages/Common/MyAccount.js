import React, { useEffect, useMemo, useState } from 'react';
import { UserCog } from 'lucide-react';
import { authorizedFetch } from '../../api/apiClient';
import '../../styles/Dashboard.css';

const MyAccount = ({ roleLabel = 'User' }) => {
  const [form, setForm] = useState({
    email: '',
    phone: '',
    address: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const session = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('smdss_session') || '{}');
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!session.user_id) {
        setError('No active session found. Please login again.');
        setLoading(false);
        return;
      }

      try {
        const response = await authorizedFetch(`http://localhost:5000/api/users/${session.user_id}/profile`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load profile');

        setForm((prev) => ({
          ...prev,
          email: data.profile?.email || '',
          phone: data.profile?.phone || '',
          address: data.profile?.address || ''
        }));
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [session.user_id]);

  const onChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const payload = {
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        password: form.password.trim()
      };

      const response = await authorizedFetch(`http://localhost:5000/api/users/${session.user_id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profile');

      const nextSession = {
        ...session,
        email: payload.email
      };
      localStorage.setItem('smdss_session', JSON.stringify(nextSession));

      setForm((prev) => ({ ...prev, password: '' }));
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container fade-in">
      <div className="glass-panel" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="flex items-center gap-2 mb-2">
          <UserCog size={20} color="var(--primary-color)" />
          <h1 className="page-header" style={{ margin: 0 }}>My Account ({roleLabel})</h1>
        </div>
        <p className="page-subtitle">Update your email, phone, address, and password.</p>

        {loading ? (
          <div style={{ padding: '1rem 0' }}>Loading profile...</div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={onChange('email')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" type="text" value={form.phone} onChange={onChange('phone')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-control" type="text" value={form.address} onChange={onChange('address')} required />
            </div>

            <div className="form-group">
              <label className="form-label">New Password (optional)</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={onChange('password')}
                placeholder="Leave empty to keep current password"
              />
            </div>

            {error ? <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p> : null}
            {message ? <p style={{ color: 'var(--success-color)', marginBottom: '1rem' }}>{message}</p> : null}

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default MyAccount;
