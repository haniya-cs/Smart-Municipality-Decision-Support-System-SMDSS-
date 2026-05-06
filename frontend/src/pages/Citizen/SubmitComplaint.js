import React, { useState } from 'react';
import { Send, MapPin, Camera, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authorizedFetch } from '../../api/apiClient';
import '../../styles/SubmitComplaint.css';

const SubmitComplaint = () => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState('');
  const [locationError, setLocationError] = useState('');
  const [categoryId, setCategoryId] = useState('7');
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  // Detect language: returns 'ar' for Arabic, 'en' for English
  const detectLanguage = (text) => {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/;
    return arabicPattern.test(text) ? 'ar' : 'en';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate location
    if (!location.trim()) {
      setLocationError('Location is required');
      setIsSubmitting(false);
      return;
    }
    setLocationError('');

    // Get citizen_id from session
    const session = JSON.parse(localStorage.getItem('smdss_session') || '{}');
    const citizenId = session.citizen_id || 'LB-1004'; // Default for testing if not found

    // Detect language from description
    const language = detectLanguage(description);

    try {
      // First, submit the complaint
      const response = await authorizedFetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizen_id: citizenId,
          description: description,
          location: location,
          category_id: parseInt(categoryId),
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        const complaintId = data.complaint_id;

        // If an image was selected, upload it
        if (selectedImage) {
          console.log("Uploading image:", selectedImage.name, "for complaint:", complaintId);
          
          const formData = new FormData();
          formData.append('image', selectedImage);

          try {
            const imageResponse = await authorizedFetch(`http://localhost:5000/api/complaints/${complaintId}/images`, {
              method: 'POST',
              body: formData
            });
            
            const result = await imageResponse.json();
            console.log("Image upload response:", imageResponse.status, result);
            
            if (!imageResponse.ok) {
              console.error("Image upload error:", result);
            }
          } catch (imgErr) {
            console.error("Image upload failed:", imgErr);
          }
        }

        navigate('/citizen/complaints');
      } else {
        const errData = await response.json();
        alert("Failed to submit complaint: " + (errData.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
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
                <label className="form-label">Location</label>
                <div className="input-icon-wrapper">
                  <div className="input-icon">
                    <MapPin size={18} color="var(--text-muted)" />
                  </div>
                  <input 
                    type="text" 
                    className={`form-control input-with-icon ${locationError ? 'input-error' : ''}`} 
                    placeholder="Street name or landmark..." 
                    value={location} 
                    onChange={(e) => {
                      setLocation(e.target.value);
                      if (e.target.value.trim()) setLocationError('');
                    }} 
                  />
                </div>
                {locationError && <small className="text-danger">{locationError}</small>}
              </div>
              
             <div className="form-group form-group-nomargin">
              <label className="form-label">Category</label>
              <select className="form-control" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="1">Roads & Potholes (الطرق والحفر)</option>
                <option value="2">Water Issues (مشاكل المياه)</option>
                <option value="3">Sewage & Drainage (الصرف الصحي)</option>
                <option value="4">Electricity Problems (مشاكل الكهرباء)</option>
                <option value="5">Traffic Problems (مشاكل السير)</option>
                <option value="6">Illegal Construction (البناء المخالف)</option>
                <option value="7">Other (أخرى)</option>
              </select>
            </div>

              <div className="form-group form-group-nomargin">
                <label className="form-label">Attach Photo (Optional)</label>
                <div className="input-icon-wrapper">
                  <div className="input-icon">
                    <Camera size={18} color="var(--text-muted)" />
                  </div>
                  <input 
                    type="file" 
                    className="form-control file-input-with-icon" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                {selectedImage && (
                  <small className="text-muted">Selected: {selectedImage.name}</small>
                )}
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
