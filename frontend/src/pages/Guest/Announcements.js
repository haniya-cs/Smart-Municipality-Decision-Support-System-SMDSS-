import React, { useState, useEffect } from 'react';
import { BellRing, Calendar, Megaphone, Info, Image as ImageIcon } from 'lucide-react';
import '../../styles/Announcements.css';

const Announcements = () => {
  const [filter, setFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keeping it updated for real-time expiry testing (optional)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Simulated announcements data with Publish-Start, Publish-End, and Image
  // Notice the dates are format "YYYY-MM-DD" or similar parseable formats.
  const announcementsList = [
    {
      id: 1,
      type: 'urgent',
      title: 'Water Main Break on Hamra Street',
      content: 'Repair crews are currently on-site. Expected resolution time is 4 hours. Please avoid the area if possible.',
      publishStart: '2026-04-01T08:00:00',
      publishEnd: '2026-12-31T23:59:59',
      image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
      icon: <BellRing size={24} color="var(--danger-color)" />
    },
    {
      id: 2,
      type: 'urgent',
      title: 'Storm Warning',
      content: 'Please ensure all loose outdoor items are secured. Heavy winds expected this evening starting at 8 PM.',
      publishStart: '2026-04-05T08:00:00',
      publishEnd: '2026-12-31T23:59:59',
      image: null,
      icon: <BellRing size={24} color="var(--danger-color)" />
    },
    {
      id: 3,
      type: 'general',
      title: 'Annual Spring Festival',
      content: 'Join us this weekend at the central park for the Annual Spring Festival. Food trucks, local bands, and activities for kids!',
      publishStart: '2026-03-01T00:00:00',
      publishEnd: '2026-10-30T23:59:59',
      image: 'https://images.unsplash.com/photo-1533174000255-a638c11aa503?auto=format&fit=crop&w=600&q=80',
      icon: <Calendar size={24} color="var(--success-color)" />
    },
    {
      id: 4,
      type: 'general',
      title: 'City Council Public Hearing',
      content: 'Open meeting regarding the new infrastructure budget. All citizens are invited to attend and voice their opinions.',
      publishStart: '2026-01-01T00:00:00',
      publishEnd: '2026-11-20T23:59:59',
      image: null,
      icon: <Megaphone size={24} color="var(--primary-color)" />
    },
    {
      id: 5,
      type: 'general',
      title: 'Expired Old Announcement',
      content: 'This announcement has already expired and should not be visible to the user.',
      publishStart: '2025-01-01T00:00:00',
      publishEnd: '2025-12-31T23:59:59',
      image: null,
      icon: <Info size={24} color="var(--info-color)" />
    }
  ];

  const filteredAnnouncements = announcementsList.filter((item) => {
    // 1. Check if the current time is within publishStart and publishEnd
    const start = new Date(item.publishStart);
    const end = new Date(item.publishEnd);
    if (currentTime < start || currentTime > end) {
      return false; // hide if outside publish window
    }

    // 2. Apply type filter
    if (filter === 'all') return true;
    return item.type === filter;
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
