import React, { useState } from 'react';
import { UserPlus, CheckCircle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Register.css';

const Register = () => {
  const [citizenId, setCitizenId] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleValidation = (e) => {
    e.preventDefault();
    if (!citizenId.trim()) return;
    
    setIsChecking(true);
    setError('');

    // Simulate real-time progressive validation with National Registry
    setTimeout(() => {
      setIsChecking(false);
      // Dummy logic: ID must be at least 5 chars to pass
      if (citizenId.length >= 5) {
        setIsValidated(true);
      } else {
        setError('Invalid Citizen ID against the National Registry Database.');
      }
    }, 1500);
  };

  const handleRegistration = (e) => {
    e.preventDefault();
    // In a real app we'd dispatch an action or API call
    navigate('/citizen/dashboard');
  };

  return (
    <div className="container flex justify-center items-center fade-in register-container">
      <div className="glass-panel register-panel">
        <div className="text-center mb-6">
          <div className="register-icon-wrapper">
            <UserPlus size={30} color="var(--primary-color)" />
          </div>
          <h2 className="title-margin">Citizen Registration</h2>
          <p className="subtitle">Securely link your identity to access SMDSS services.</p>
        </div>

        {!isValidated ? (
          <form onSubmit={handleValidation}>
            <div className="form-group">
              <label className="form-label">National Citizen ID Number</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Enter your 10-digit ID..." 
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
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
              style={{ opacity: isChecking ? 0.7 : 1 }}
              disabled={isChecking}
            >
              {isChecking ? 'Verifying with National Registry...' : 'Validate ID'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegistration} className="fade-in">
            <div className="success-banner">
              <CheckCircle size={20} /> <span>Identity Verified!</span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" placeholder="John Doe" required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" placeholder="johndoe@example.com" required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="••••••••" required />
            </div>

            <button type="submit" className="btn btn-primary full-width-btn">
              Complete Registration
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
