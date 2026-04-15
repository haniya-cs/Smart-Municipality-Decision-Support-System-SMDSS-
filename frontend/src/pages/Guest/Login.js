import React, { useState } from 'react';
import { User, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Register.css'; // Reusing similar classes like register-container, register-panel

const Login = () => {
  const [citizenId, setCitizenId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!citizenId.trim() || !password.trim()) return;

    setIsLoggingIn(true);
    setError('');

    // Simulate login logic based on Citizen ID
    setTimeout(() => {
      setIsLoggingIn(false);
      
      // Dummy Logic for Routing based on simulated roles:
      // ID starts with '1' => Citizen
      // ID starts with '2' => Admin
      // ID starts with '3' => Both (Citizen & Admin)
      if (citizenId.startsWith('1')) {
        navigate('/citizen/dashboard');
      } else if (citizenId.startsWith('2')) {
        navigate('/admin/dashboard');
      } else if (citizenId.startsWith('3')) {
        navigate('/role-selection');
      } else {
        // Default to Citizen if they enter something else
        navigate('/citizen/dashboard');
      }
    }, 1000);
  };

  return (
    <div className="container flex justify-center items-center fade-in register-container">
      <div className="glass-panel register-panel">
        <div className="text-center mb-6">
          <div className="register-icon-wrapper">
            <User size={30} color="var(--primary-color)" />
          </div>
          <h2 className="title-margin">Welcome Back</h2>
          <p className="subtitle">Enter your credentials to manage your account.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Citizen ID Number / Employee ID</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="E.g. 1000000001" 
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

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center' }}>
             (Simulate: starts with '1' = Citizen, '2' = Admin, '3' = Both)
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
