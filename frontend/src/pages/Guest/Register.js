import React, { useState } from 'react';
import { UserPlus, CheckCircle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Register.css';

const Register = () => {
  const [citizenId, setCitizenId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleValidation = async (e) => {
    e.preventDefault();
    if (!citizenId.trim()) return;
    
    setIsChecking(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/verify-citizen-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizen_id: citizenId })
      });
      const data = await response.json();
      
      if (response.ok) {
        setFullName(data.full_name);
        setIsValidated(true);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (!email || !password || !phone || !address) return;
    
    setIsRegistering(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizen_id: citizenId, email, password, phone, address })  // Add address if needed
      });
      const data = await response.json();
      
      if (response.ok) {
        if (data.role_id === 2) {
          navigate('/citizen/dashboard');
        } else {
          setError('Role not supported.');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsRegistering(false);
    }
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
              {isChecking ? 'Verifying...' : 'Validate ID'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegistration} className="fade-in">
            <div className="success-banner">
              <CheckCircle size={20} /> <span>Identity Verified!</span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={fullName} 
                readOnly 
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="johndoe@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="tel" 
                className="form-control" 
                placeholder="70123456" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
            </div>
           
           <div className="form-group">
              <label className="form-label">Address</label>
             <input  type="text" className="form-control" placeholder="Enter your address"value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
             />
          </div>


            <button 
              type="submit" 
              className="btn btn-primary full-width-btn"
              disabled={isRegistering}
            >
              {isRegistering ? 'Registering...' : 'Complete Registration'}
            </button>
            {error && (
              <div className="error-msg">
                <ShieldAlert size={16} /> <span>{error}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;