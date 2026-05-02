import React, { useState, useEffect } from 'react';
import { BellRing, Calendar, Megaphone, Info, Image as ImageIcon } from 'lucide-react';
import '../../styles/Announcements.css';

const Announcements = () => {
  const [filter, setFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Keeping it updated for real-time expiry testing (optional)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch announcements from API
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/announcements/public');
      const data = await response.json();
      
      if (data.announcements && data.announcements.length > 0) {
        // Transform API data to match the expected format
        const transformed = data.announcements.map((item, index) => ({
          id: item.announcement_id,
          type: item.type,
          title: item.title,
          content: item.content,
          publishStart: item.publish_start,
          publishEnd: item.publish_end,
          image: item.image ? `http://localhost:5000${item.image}` : null,
          icon: getIconForType(item.type),
          admin_name: item.admin_name
        }));
        setAnnouncementsList(transformed);
      } else {
        setAnnouncementsList([]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Fallback to empty array - announcements will show as empty
      setAnnouncementsList([]);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'urgent':
        return <BellRing size={24} color="var(--danger-color)" />;
      case 'event':
        return <Calendar size={24} color="var(--success-color)" />;
      case 'meeting':
        return <Megaphone size={24} color="var(--primary-color)" />;
      case 'maintenance':
        return <Info size={24} color="var(--info-color)" />;
      default:
        return <Megaphone size={24} color="var(--primary-color)" />;
    }
  };

  const filteredAnnouncements = announcementsList.filter((item) => {

  if (item.publishStart && item.publishEnd) {
    const start = new Date(item.publishStart);
    const end = new Date(item.publishEnd);
    if (currentTime < start || currentTime > end) {
      return false;
    }
  }

  if (filter === 'all') return true;
  if (filter === 'urgent') {
  return item.type?.toLowerCase() === 'urgent';
}
  if (filter === 'general') return item.type !== 'urgent';

  return true;
});

  return (
    <div className="container fade-in">
      <div className="announcements-header text-center">
        <h1 className="page-header">Public Announcements</h1>
        <p className="page-subtitle">Stay updated with the latest news, events, and urgent alerts from your municipality.</p>
        
        {/* Filter Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`btn ${filter === 'urgent' ? 'btn-danger' : 'btn-outline'}`}
            onClick={() => setFilter('urgent')}
          >
            Urgent
          </button>
          <button 
            className={`btn ${filter === 'general' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('general')}
          >
            General
          </button>
        </div>
      </div>

      <div className="announcements-list">
        {filteredAnnouncements.map((announcement) => (
          <div 
            key={announcement.id} 
            className={`glass-panel announcement-card ${announcement.type === 'urgent' ? 'urgent-announcement' : ''}`}
          >
            <div className="announcement-layout-flex">
              {/* Image Section */}
              {announcement.image ? (
                <div className="announcement-image-wrapper">
                  <img src={announcement.image} alt={announcement.title} className="announcement-image" />
                </div>
              ) : (
                <div className="announcement-icon-wrapper">
                  {announcement.icon}
                </div>
              )}

              {/* Text Section */}
              <div className="announcement-content-wrapper">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <h3 className="announcement-title">{announcement.title}</h3>
                  <span className="announcement-date">
                    {new Date(announcement.publishStart).toLocaleDateString()}
                  </span>
                </div>
                <p className="announcement-text">{announcement.content}</p>
                
                {announcement.type === 'urgent' ? (
                  <span className="badge badge-danger">Urgent Alert</span>
                ) : (
                  <span className="badge badge-info">General Info</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredAnnouncements.length === 0 && (
          <p className="text-center" style={{ color: 'var(--text-muted)' }}>No announcements available.</p>
        )}
      </div>
    </div>
  );
};

export default Announcements;
