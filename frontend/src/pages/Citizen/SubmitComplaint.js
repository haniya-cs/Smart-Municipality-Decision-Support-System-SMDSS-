import React, { useState } from 'react';
import { Send, MapPin, Camera, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/SubmitComplaint.css';

const SubmitComplaint = () => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate AI processing & DB save delay
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/citizen/dashboard');
    }, 2000);
  };

  return (
    <div className="container fade-in">
      <div className="complaint-container">
        <h1 className="mb-4">Submit a Complaint</h1>
        <p className="complaint-subtitle">
          Please describe the issue in detail. Our AI will automatically categorize it and determine its priority to ensure swift action.
        </p>

        <div className="glass-panel text-left">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Issue Description (Required)</label>
              <textarea 
                className="form-control complaint-textarea" 
                rows="5" 
                placeholder="E.g., There is a massive water pipe explosion on Street A..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
              <div className="ai-info-text">
                <AlertCircle size={14} /> <span>Our AI reads this to categorize and prioritize. Be descriptive!</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="form-group form-group-nomargin">
                <label className="form-label">Location (Optional)</label>
                <div className="input-icon-wrapper">
                  <div className="input-icon">
                    <MapPin size={18} color="var(--text-muted)" />
                  </div>
                  <input type="text" className="form-control input-with-icon" placeholder="Street name or landmark..." />
                </div>
              </div>
              
              <div className="form-group form-group-nomargin">
                <label className="form-label">Attach Photo (Optional)</label>
                <div className="input-icon-wrapper">
                  <div className="input-icon">
                    <Camera size={18} color="var(--text-muted)" />
                  </div>
                  <input type="file" className="form-control file-input-with-icon" accept="image/*" />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center form-footer">
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary submit-btn" 
                disabled={isSubmitting || description.trim() === ''}
              >
                {isSubmitting ? 'AI Engine Processing...' : 'Submit to AI Engine'} <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitComplaint;
