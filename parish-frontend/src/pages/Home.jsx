import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Home.css";
import Footer from "../components/Footer";
import UserManual from "../components/UserManual";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

function HomePage() {
  const [announcements, setAnnouncements] = useState([]);
  const [massTimings, setMassTimings] = useState([]);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`${API_BASE}/announcements`); 
        if (!response.ok) {
          throw new Error("Failed to fetch announcements");
        }
        const data = await response.json();
        const sortedAnnouncements = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAnnouncements(sortedAnnouncements);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const fetchMassTimings = async () => {
      try {
        const response = await fetch(`${API_BASE}/mass-timings`); 
        if (!response.ok) {
          throw new Error("Failed to fetch mass timings");
        }
        const data = await response.json();
        setMassTimings(data);
      } catch (error) {
        console.error("Error fetching mass timings:", error);
      }
    };
    fetchMassTimings();
  }, []);

  return (
    <div className="home">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/logo.png" alt="ParishConnect Logo" className="navbar-logo" />
        </div>

        <div className="nav-links">
          <button 
            className="btn-help"
            onClick={() => setManualOpen(true)}
            title="View user manual"
          >
            {/* Question mark icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4m0-4h.01"></path>
            </svg>
          </button>
          <Link to="/login">
            <button className="btn btn-primary">Login</button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <h1>St. Christopher's Church, Tivim</h1>
    

        {/* ACTION BUTTONS */}
        <div className="hero-actions">
          <Link to="/mass-booking">
            <button className="btn btn-primary">
              Book a Mass
            </button>
          </Link>

          <Link to="/donate">
            <button className="btn btn-secondary">
              Make a Donation
            </button>
          </Link>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="container content-grid">

        {/* ANNOUNCEMENTS */}
        <section className="announcements">

          <h2>Latest Announcements</h2>
          {announcements.length > 0 ? (
            announcements.map((announcement, index) => (
              <article key={index} className="card">
                <h3>{announcement.title}</h3>
                <p className="card-meta">
                  <span className="date">
                    {new Date(announcement.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {announcement.category && <span className="tag tag-secondary">` {announcement.category}</span>}
                </p>
                <p className="card-text">{announcement.message}</p>
              </article>
            ))
          ) : (
            <div className="card empty-state">
              <p>No announcements available at this time.</p>
            </div>
          )}
        </section>

        {/* SIDEBAR */}
        <aside className="sidebar">

          <div className="card mass-card">
            <h3>Mass Timings</h3>
            <div className="mass-schedule">
              {massTimings.length > 0 ? (
                massTimings.map((timing, index) => (
                  <div key={index} className={timing.day === "Sunday" ? "mass-item highlight" : "mass-item"}>
                    <span className="day">{timing.day}</span>
                    <span className="time">{timing.time}</span>
                  </div>
                ))
              ) : (
                <div className="mass-item">
                  <span className="day">Loading...</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* FOOTER */}
      <Footer />

      {/* USER MANUAL MODAL */}
      <UserManual isOpen={manualOpen} onClose={() => setManualOpen(false)} section="general" />
    </div>
  );
}

export default HomePage;
