import React, { useState } from 'react';
import { User, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Register.css'; 

const Login = () => {
  const [citizenId, setCitizenId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!citizenId.trim() || !password.trim()) {
      setError('Citizen ID and password are required.');
      return;
    }

    setIsLoggingIn(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizen_id: citizenId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save session data to localStorage
        localStorage.setItem(
          'smdss_session',
          JSON.stringify({
            role: data.roles[0] === 1 ? 'admin' : 'citizen',
            user_id: data.user_id,
            citizen_id: data.citizen_id,
            full_name: data.full_name || '',
            email: data.email || ''
          })
        );

        // Check the role and navigate accordingly
        if (data.roles && data.roles.length > 1) {
          navigate('/role-selection', { state: { roles: data.roles } });
        } else if (data.roles && data.roles.length === 1) {
          const role = data.roles[0];
          if (role === 1) {
            navigate('/admin/dashboard');
          } else if (role === 2) {
            navigate('/citizen/dashboard');
          } else {
            setError('Access denied. Unknown role.');
          }
        } else {
          setError('Access denied. No roles found.');
        }
      } else {
        // Handle errors from the server
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="container flex justify-center items-center fade-in register-container">
      <div className="glass-panel register-panel">
        <div className="text-center mb-6">
          <div className="register-icon-wrapper">
            <User size={30} color="var(--primary-color)" />
          </div>
          <h2 className="title-margin">Welcome Back</h2>
          <p className="subtitle">Enter your credentials to manage your account (Citizen/Admin)</p>
        </div>

        <form onSubmit={handleLogin}>
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
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <div className="error-msg">
                <ShieldAlert size={16} /> <span>{error}</span>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary full-width-btn" 
            style={{ opacity: isLoggingIn ? 0.7 : 1 }}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;