import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, BellRing, FileText, Brain, CreditCard, Users } from 'lucide-react';
import '../../styles/Home.css';

const Home = () => {
  const [urgentAnnouncements, setUrgentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [homeStats, setHomeStats] = useState({
    complaints_resolved: null,
    satisfaction_percent: null,
    avg_resolution_hours: null
  });

  useEffect(() => {
    fetchUrgentAnnouncements();
    fetchHomeStats();
  }, []);

  const fetchUrgentAnnouncements = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/announcements/urgent');
      const data = await response.json();
      
      if (data.announcements) {
        setUrgentAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('Error fetching urgent announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHomeStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/public/home-stats');
      if (!response.ok) return;
      const data = await response.json();
      setHomeStats({
        complaints_resolved: data.complaints_resolved ?? null,
        satisfaction_percent: data.satisfaction_percent ?? null,
        avg_resolution_hours: data.avg_resolution_hours ?? null
      });
    } catch (e) {
      console.error('Error fetching home stats:', e);
    }
  };

  const resolvedDisplay =
    homeStats.complaints_resolved === null
      ? '—'
      : `${new Intl.NumberFormat('en-US').format(homeStats.complaints_resolved)}+`;

  const satisfactionDisplay =
    homeStats.satisfaction_percent === null ? '—' : `${homeStats.satisfaction_percent}%`;

  const avgResponseDisplay = (() => {
    if (homeStats.avg_resolution_hours === null || Number.isNaN(homeStats.avg_resolution_hours)) {
      return '—';
    }
    const h = Math.round(homeStats.avg_resolution_hours);
    return h <= 48 ? '< 48h' : `${h}h`;
  })();

  return (
    <div className="fade-in">
      <div className="container">
        {/* Hero Section */}
        <div className="text-center home-hero">
          <h1 className="home-hero-title">
            Welcome to the <span className="text-gradient">Smart Municipality</span>
          </h1>
          <p className="home-hero-desc">
            Bridging the gap between citizens and city officials. Report issues, track their resolution, and pay your dues seamlessly through our AI-powered portal.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/guest/register" className="btn btn-primary home-btn">
              Get Started
            </Link>
            <Link to="/guest/announcements" className="btn btn-outline home-btn">
              View Announcements
            </Link>
          </div>
        </div>

        {/* Urgent Announcements */}
        {!loading && urgentAnnouncements.length > 0 && (
          <div className="glass-panel urgent-panel">
            <div className="flex items-center gap-2 mb-2">
              <BellRing size={20} color="var(--danger-color)" />
              <h3 className="urgent-title">Urgent Announcements</h3>
            </div>
            {urgentAnnouncements.map((announcement, index) => (
              <p key={announcement.announcement_id} className={index === urgentAnnouncements.length - 1 ? 'urgent-text-nomargin' : 'urgent-text-margin'}>
                <strong>{announcement.title}:</strong> {announcement.content}
              </p>
            ))}
          </div>
        )}

        {/* Features Grid */}
        <div className="text-center mb-8">
          <h2>How SMDSS Works</h2>
          <p className="page-subtitle">An end-to-end platform for smarter municipal governance powered by AI.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 features-grid">
          {/* Card 1 */}
          <div className="glass-panel feature-card">
            <div className="feature-icon mb-3">
              <FileText size={28} color="var(--primary-color)" />
            </div>
            <h3 className="feature-title">Smart Complaints</h3>
            <p className="feature-desc">Submit and track complaints with AI-powered prioritization.</p>
          </div>
          
          {/* Card 2 */}
          <div className="glass-panel feature-card">
            <div className="feature-icon mb-3">
              <Brain size={28} color="var(--primary-color)" />
            </div>
            <h3 className="feature-title">AI Engine</h3>
            <p className="feature-desc">Automatic categorization, duplicate detection & priority scoring.</p>
          </div>
          
          {/* Card 3 */}
          <div className="glass-panel feature-card">
            <div className="feature-icon mb-3">
              <BellRing size={28} color="var(--primary-color)" />
            </div>
            <h3 className="feature-title">Announcements</h3>
            <p className="feature-desc">Stay updated with public notifications and urgent alerts.</p>
          </div>
          
          {/* Card 4 */}
          <div className="glass-panel feature-card">
            <div className="feature-icon mb-3">
              <CreditCard size={28} color="var(--primary-color)" />
            </div>
            <h3 className="feature-title">Digital Dues</h3>
            <p className="feature-desc">View and manage your property taxes and municipal bills.</p>
          </div>
          
          {/* Card 5 */}
          <div className="glass-panel feature-card">
            <div className="feature-icon mb-3">
              <Shield size={28} color="var(--primary-color)" />
            </div>
            <h3 className="feature-title">Transparency</h3>
            <p className="feature-desc">Real-time status tracking on all submitted complaints.</p>
          </div>
          
          {/* Card 6 */}
          <div className="glass-panel feature-card">
            <div className="feature-icon mb-3">
              <Users size={28} color="var(--primary-color)" />
            </div>
            <h3 className="feature-title">Citizen First</h3>
            <p className="feature-desc">Bridging the gap between citizens and municipal authorities.</p>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="stats-banner">
        <div className="container grid md:grid-cols-3 text-center">
          <div className="stat-item">
            <h2 className="stat-value text-gradient" style={{color: 'white', WebkitTextFillColor: 'white'}}>{resolvedDisplay}</h2>
            <p className="stat-label">Complaints Resolved</p>
          </div>
          <div className="stat-item">
            <h2 className="stat-value text-gradient" style={{color: 'white', WebkitTextFillColor: 'white'}}>{satisfactionDisplay}</h2>
            <p className="stat-label">Citizen Satisfaction</p>
          </div>
          <div className="stat-item">
            <h2 className="stat-value text-gradient" style={{color: 'white', WebkitTextFillColor: 'white'}}>{avgResponseDisplay}</h2>
            <p className="stat-label">Avg. Response Time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
