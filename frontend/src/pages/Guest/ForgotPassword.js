import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert } from 'lucide-react';
import '../../styles/Register.css';

const ForgotPassword = () => {
  const [citizenId, setCitizenId] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!citizenId.trim() || !email.trim() || !newPassword.trim()) {
      setError('Citizen ID, email, and new password are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizen_id: citizenId.trim(),
          email: email.trim(),
          new_password: newPassword
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to reset password');

      setMessage('Password changed successfully. You can login now.');
      setTimeout(() => navigate('/guest/login'), 700);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center fade-in register-container">
      <div className="glass-panel register-panel">
        <div className="text-center mb-6">
          <div className="register-icon-wrapper">
            <KeyRound size={30} color="var(--primary-color)" />
          </div>
          <h2 className="title-margin">Forgot Password</h2>
          <p className="subtitle">
            This reset is for <strong>Citizens only</strong>. Admin passwords are managed by the municipality.
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Citizen ID Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="E.g. LB-1XXX"
              value={citizenId}
              onChange={(e) => setCitizenId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="error-msg" style={{ marginTop: '0.5rem' }}>
              <ShieldAlert size={16} /> <span>{error}</span>
            </div>
          )}
          {message && (
            <div style={{ color: 'var(--success-color)', marginTop: '0.75rem' }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary full-width-btn"
            style={{ opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center mt-4" style={{ fontSize: '0.95rem' }}>
          <Link to="/guest/login" className="link">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

