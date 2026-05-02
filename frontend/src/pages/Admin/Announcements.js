import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import '../../styles/Dashboard.css';

const AdminAnnouncements = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'general',
    publish_start: '',
    publish_end: '',
    content: '',
    image: null
  });


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Get admin_id from localStorage (assuming it's stored after login)
      const session = JSON.parse(localStorage.getItem('smdss_session') || '{}');
      const admin_id = session?.citizen_id;
      const formDataToSend = new FormData();
      formDataToSend.append('admin_id', admin_id);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('type',  (formData.type || 'general').toLowerCase().trim());
      formDataToSend.append('publish_start', formData.publish_start);
      formDataToSend.append('publish_end', formData.publish_end);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await fetch('http://localhost:5000/api/announcements', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Announcement published successfully!' });
        // Reset form
        setFormData({
          title: '',
          type: 'general',
          publish_start: '',
          publish_end: '',
          content: '',
          image: null
        });
        // Refresh list
        // (Announcements are managed separately)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to publish announcement' });
      }
    } catch (error) {
      console.error('Error publishing announcement:', error);
      setMessage({ type: 'error', text: 'An error occurred while publishing' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in">
      <div className="citizen-welcome mb-8">
        <h1>Announcements Management</h1>
        <p>Create and publish public announcements to be displayed on the Guest and Citizen portals.</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`alert alert-${message.type} mb-4`}>
          {message.text}
        </div>
      )}

      {/* Post New Announcement Section */}
      <div className="flex items-center gap-2 mb-4">
        <PlusCircle size={24} color="var(--primary-color)" />
        <h2 className="board-title">Publish New Announcement</h2>
      </div>

      <div className="glass-panel text-left">
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Announcement Title</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="E.g., Water Cut in West District"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group mb-0">
              <label className="form-label">Announcement Type</label>
              <select 
                className="form-control"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="urgent">Urgent / Alert (طوارئ)</option>
                <option value="event">Event / Festival (فعاليات ومهرجانات)</option>
                <option value="general">General Info / Ads (إعلانات عامة)</option>
                <option value="meeting">Meeting / Hearing (جلسات واجتماعات)</option>
                <option value="maintenance">Scheduled Maintenance (صيانة مجدولة)</option>
              </select>
            </div>
            
            <div className="form-group mb-0">
              <label className="form-label">Publish Start Date</label>
              <input 
                type="datetime-local" 
                className="form-control"
                name="publish_start"
                value={formData.publish_start}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group mb-0">
              <label className="form-label">Publish End Date (Expiry)</label>
              <input 
                type="datetime-local" 
                className="form-control"
                name="publish_end"
                value={formData.publish_end}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group mt-4">
            <label className="form-label">Announcement Content</label>
            <textarea 
              className="form-control" 
              rows="4" 
              placeholder="Detailed description of the announcement..."
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
            ></textarea>
          </div>

          <div className="form-group mt-4">
            <label className="form-label">Upload Image (Optional)</label>
            <input 
              type="file" 
              className="form-control" 
              accept="image/*" 
              style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
              onChange={handleFileChange}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Accepted formats: JPG, PNG, GIF. Max size: 5MB.</small>
          </div>

          <div className="flex justify-end mt-4">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
