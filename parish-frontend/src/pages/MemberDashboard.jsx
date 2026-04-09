import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./MemberDashboard.css";
import BackButton from "../components/BackButton";
import { API_BASE_URL } from "../config/api";

function MemberDashboard() {
  const [activeTab, setActiveTab] = useState("Sacrament Records");
  const [announcements, setAnnouncements] = useState([]);
  const [altarAssignments, setAltarAssignments] = useState([]);
  const [lectorAssignments, setLectorAssignments] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [myRecords, setMyRecords] = useState([]);
  const userName = localStorage.getItem("userName") || "Member";
  const userCommunity = localStorage.getItem("userCommunity") || "None";

  useEffect(() => {
    fetch(`${API_BASE_URL}/announcements`)
      .then(res => res.json())
      .then(data => {
        // Filter announcements for the specific community or general ones
        const filtered = data.filter(a => a.category?.includes(userCommunity) || a.category === "General");
        setAnnouncements(filtered);
      });

    if (userCommunity === "Altar") {
      fetch(`${API_BASE_URL}/altar-assignments`)
        .then(res => res.json())
        .then(data => setAltarAssignments(data))
        .catch(err => console.error(err));
    }

    if (userCommunity === "Lector") {
      fetch(`${API_BASE_URL}/lector-assignments`)
        .then(res => res.json())
        .then(data => setLectorAssignments(data))
        .catch(err => console.error(err));
    }

    fetch(`${API_BASE_URL}/gallery`)
      .then(res => res.json())
      .then(data => setGalleryItems(data))
      .catch(err => console.error(err));

    fetch(`${API_BASE_URL}/records`)
      .then(res => res.json())
      .then(data => {
        // Filter records belonging to this specific member
        const filtered = data.filter(r => r.name === userName);
        setMyRecords(filtered);
      })
      .catch(err => console.error(err));
  }, [userCommunity, userName]);

  return (
    <div className="member-container">

      {/* HEADER */}
      <div className="member-header">
        <div>
          <BackButton onClick={() => {setActiveTab("Home Management"); setView("list"); setSearch("");}} />
          <h1>Parish Home</h1>
          <p>| {userName}</p>
        </div>

        {/* COMMUNITY CHAT LINK */}
        <Link to="/community-chats">
          <button className="chat-btn">
            Community Chat
          </button>
        </Link>
      </div>

      {/* TABS */}
      <div className="member-tabs">
        {["Sacrament Records", "Communities", "Parish Gallery"].map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? "active-tab" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ========================= */}
      {/* SACRAMENT RECORDS TAB */}
      {/* ========================= */}
      {activeTab === "Sacrament Records" && (
        <div className="head-card">
          <h2>Your Sacrament Records</h2>
          <p className="sub">Official archival records linked to your profile.</p>
          
          <div style={{ marginTop: '20px' }}>
            {myRecords.length > 0 ? (
              myRecords.map((r, i) => (
                <div key={i} className="mass-row" style={{ marginBottom: '10px', padding: '15px', background: '#fff', borderRadius: '10px', borderLeft: '4px solid #4e54c8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2d3281' }}>{r.type}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>Date: {new Date(r.date).toLocaleDateString()}</div>
                </div>
              ))
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic' }}>No sacrament records found for your name.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* COMMUNITIES TAB */}
      {/* ========================= */}
      {activeTab === "Communities" && (
        <div>

          <h2>Your Communities</h2>

            <div className="community-card">
              <h3>{userCommunity !== "None" ? `${userCommunity} Ministry` : "No Ministry Assigned"}</h3>

              <div className="community-section">
                <h4>Ministry Announcements</h4>
                {announcements.length > 0 ? announcements.map((a, i) => (
                  <p key={i} className="announcement-item">
                    <strong>{a.title}</strong>: {a.message}
                  </p>
                )) : <p>No specific updates for your ministry.</p>}
              </div>

              {userCommunity === "Altar" && (
                <div className="community-section" style={{marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '15px'}}>
                  <h4>Mass Duty Schedule</h4>
                  {altarAssignments.length > 0 ? altarAssignments.map((duty, idx) => (
                    <div key={idx} style={{background: '#f9f9f9', padding: '10px', borderRadius: '8px', marginBottom: '10px'}}>
                      <p style={{margin: '0', fontWeight: 'bold'}}>{new Date(duty.date).toDateString()} @ {duty.time}</p>
                      <p style={{margin: '5px 0 0 0', fontSize: '0.85rem', color: '#555'}}>Servers: {duty.servers.join(", ")}</p>
                    </div>
                  )) : <p>No upcoming duties assigned.</p>}
                </div>
              )}

              {userCommunity === "Lector" && (
                <div className="community-section" style={{marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '15px'}}>
                  <h4>Mass Reading Schedule</h4>
                  {lectorAssignments.length > 0 ? lectorAssignments.map((duty, idx) => (
                    <div key={idx} style={{background: '#f9f9f9', padding: '10px', borderRadius: '8px', marginBottom: '10px'}}>
                      <p style={{margin: '0', fontWeight: 'bold'}}>{new Date(duty.date).toDateString()} @ {duty.time}</p>
                      <div style={{fontSize: '0.85rem', color: '#555', marginTop: '5px'}}>
                        {duty.readings.map((r, i) => <div key={i}>• {r.type === "Custom" ? r.custom : r.type} : {r.person}</div>)}
                      </div>
                    </div>
                  )) : <p>No upcoming readings assigned.</p>}
                </div>
              )}
            </div>
        </div>
      )}

      {/* ========================= */}
      {/* PARISH GALLERY TAB */}
      {/* ========================= */}
      {activeTab === "Parish Gallery" && (
        <div className="head-card">
          <h2>Parish Gallery</h2>
          <p className="sub">Latest memories and events from our community.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px', marginTop: '25px' }}>
            {galleryItems.map(item => (
              <div key={item._id} className="gallery-item-container" style={{ borderRadius: '12px', overflow: 'hidden', height: '220px' }}>
                <img src={item.image} alt={item.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="gallery-overlay">
                  <p className="gallery-caption">{item.caption || "Untitled"}</p>
                  <small className="gallery-date">{new Date(item.date).toLocaleDateString()}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default MemberDashboard;