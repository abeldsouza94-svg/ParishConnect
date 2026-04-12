import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./AltarHeadDashboard.css";
import CommunityChat from "./CommunityChat";
import BackButton from "../components/BackButton";
import LoadingOverlay from "../components/LoadingOverlay";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

const AltarHeadDashboard = () => {

  const [activeTab, setActiveTab] = useState("Announcements");
  const [isLoading, setIsLoading] = useState(true);

  const [altarServers, setAltarServers] = useState([]);
  const [notification, setNotification] = useState(null);

  const [altarDate, setAltarDate] = useState("");
  const [altarTime, setAltarTime] = useState("");
  const [assignedServers, setAssignedServers] = useState([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [altarAssignments, setAltarAssignments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [customAltarTime, setCustomAltarTime] = useState("");
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageCaption, setImageCaption] = useState("");

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        const [familiesRes, assignmentsRes, galleryRes] = await Promise.all([
          fetch(`${API_BASE}/families`),
          fetch(`${API_BASE}/altar-assignments`),
          fetch(`${API_BASE}/gallery`)
        ]);

        if (familiesRes.ok) {
          const families = await familiesRes.json();
          const servers = [];
          families.forEach(family => {
            family.members?.forEach(member => {
              if (member.community?.toLowerCase() === "altar") {
                servers.push(member.name);
              }
            });
          });
          setAltarServers(servers);
        }

        if (assignmentsRes.ok) {
          setAltarAssignments(await assignmentsRes.json());
        }

        if (galleryRes.ok) {
          setGalleryItems(await galleryRes.json());
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading altar dashboard:", err);
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${API_BASE}/altar-assignments`);
      if (res.ok) setAltarAssignments(await res.json());
    } catch (err) { console.error("Error fetching assignments", err); }
  };

  const fetchGallery = async () => {
    try {
      const res = await fetch(`${API_BASE}/gallery`);
      if (res.ok) setGalleryItems(await res.json());
    } catch (err) { console.error("Error fetching gallery", err); }
  };

  const getUnassignedCount = () => {
    const today = new Date();
    const currentDay = today.getDay();
    // Find the next Saturday and Sunday
    const satOffset = currentDay === 6 ? 0 : (6 - currentDay + 7) % 7;
    const sunOffset = currentDay === 0 ? 0 : (0 - currentDay + 7) % 7;

    const thisSat = new Date(today); thisSat.setDate(today.getDate() + satOffset);
    const thisSun = new Date(today); thisSun.setDate(today.getDate() + sunOffset);
    
    const satStr = thisSat.toISOString().split('T')[0];
    const sunStr = thisSun.toISOString().split('T')[0];

    const standardSlots = [
      { date: satStr, time: "5:30 PM" },
      { date: sunStr, time: "6:30 AM" },
      { date: sunStr, time: "8:00 AM" },
      { date: sunStr, time: "10:00 AM" }
    ];

    const assignedInSlots = standardSlots.filter(slot => 
      altarAssignments.some(a => a.date === slot.date && a.time === slot.time)
    );

    return 4 - assignedInSlots.length;
  };

  const showNotify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter servers by search term
  const filteredServers = altarServers.filter(server =>
    server.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle selection of altar server
  const toggleServer = (name) => {
    if (assignedServers.includes(name)) {
      setAssignedServers(
        assignedServers.filter((s) => s !== name)
      );
    } else {
      setAssignedServers([...assignedServers, name]);
    }
  };

  // Save altar assignment
  const handleAltarAssign = async () => {
    if (!altarDate || !altarTime || assignedServers.length < 2) {
      showNotify("Assign at least 2 altar servers with date & time", "error");
      return;
    }

    const finalTime = altarTime === "Other" ? customAltarTime : altarTime;
    const payload = { date: altarDate, time: finalTime, servers: assignedServers };

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_BASE}/altar-assignments/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/altar-assignments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      showNotify(editingId ? "Assignment updated" : "Altar Servers Assigned Successfully");
      setAltarDate("");
      setAltarTime("");
      setCustomAltarTime("");
      setAssignedServers([]);
      setEditingId(null);
      fetchAssignments();
    } catch (err) { 
      console.error(err);
      showNotify(err.message || "Failed to save assignment", "error"); 
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Delete this duty assignment?")) return;
    const res = await fetch(`${API_BASE}/altar-assignments/${id}`, { method: "DELETE" });
    if (res.ok) { showNotify("Assignment deleted"); fetchAssignments(); }
  };

  const handleEditAssignment = (duty) => {
    const day = new Date(duty.date + "T00:00:00").getDay();
    const standards = day === 0 ? ["6:30 AM", "8:00 AM", "10:00 AM"] : (day === 6 ? ["6:30 AM", "5:30 PM"] : ["6:30 AM"]);

    setAltarDate(duty.date);
    if (standards.includes(duty.time)) {
      setAltarTime(duty.time);
      setCustomAltarTime("");
    } else {
      setAltarTime("Other");
      setCustomAltarTime(duty.time);
    }
    setAssignedServers(duty.servers);
    setEditingId(duty._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* =====================
      POST ANNOUNCEMENT
  ====================== */
  const handlePostAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      showNotify("Announcement title and message cannot be empty.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcementTitle,
          message: announcementMessage,
          category: "Altar Servers",
          date: new Date().toISOString().slice(0, 10), // Current date
        }),
      });
      if (!response.ok) throw new Error("Server error");
      
      showNotify("Announcement Posted Successfully!", "success");
      setAnnouncementTitle("");
      setAnnouncementMessage("");
    } catch (error) {
      console.error("Error posting announcement:", error);
      showNotify("Failed to post announcement. Check server connection.", "error");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedImage) return showNotify("Please select a photo", "error");
    try {
      const res = await fetch(`${API_BASE}/gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          caption: imageCaption,
          date: new Date().toISOString().split("T")[0]
        })
      });
      if (res.ok) {
        showNotify("Photo uploaded to gallery");
        setSelectedImage(null);
        setImageCaption("");
        fetchGallery();
      }
    } catch (err) { showNotify("Upload failed", "error"); }
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm("Delete this photo from gallery?")) return;
    try {
      const res = await fetch(`${API_BASE}/gallery/${id}`, { method: "DELETE" });
      if (res.ok) { showNotify("Photo removed from gallery"); fetchGallery(); }
    } catch (err) { showNotify("Delete failed", "error"); }
  };

  return (
    <div className="head-container">
      <LoadingOverlay isLoading={isLoading} message="Loading altar assignments..." />

      {/* HEADER */}
      <div className="head-header">
        <div>
          <BackButton onClick={() => {setActiveTab("Home Management"); setView("list"); setSearch("");}} />
          <h1>Parish Pastoral Council Portal</h1>
          <p>Altar Servers Management</p>
        </div>

        {/* COMMUNITY CHAT LINK */}
        <Link to="/community-chats">
          <button className="chat-btn" style={{ background: '#6c63ff', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer' }}>
           Community Chat
          </button>
        </Link>
      </div>

      {/* STATS */}
      <div className="head-stats">
        <div className="stat-card">
          <p>Total Altar Servers</p>
          <h2>{altarServers.length}</h2>
        </div>

        <div className="stat-card">
          <p>Upcoming Masses For The Week</p>
          <h2 style={{color: getUnassignedCount() > 0 ? '#f44336' : '#4caf50'}}>{getUnassignedCount()}</h2>
        </div>

        <div className="stat-card">
          <p>Assignments Done</p>
          <h2>{altarAssignments.length}</h2>
        </div>
      </div>

      {/* TABS */}
      <div className="head-tabs">
        {["Announcements", "Assign Servers", "Parish Gallery", "Manage Members"].map(tab => (
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
      {/* ANNOUNCEMENTS + ASSIGNMENT */}
      {/* ========================= */}
      {activeTab === "Announcements" && (
        <div className="head-card">

          {/* ANNOUNCEMENT */}
          <h2>Post Parish Announcement</h2>

          <label>Title</label>
          <input
            placeholder="e.g., Sunday Preparation Meeting"
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
          />

          <label>Message</label>
          <textarea
            placeholder="Details about the announcement..."
            value={announcementMessage}
            onChange={(e) => setAnnouncementMessage(e.target.value)}
          />

          <button className="primary-btn" onClick={handlePostAnnouncement}>
            Post Announcement
          </button>
        </div>
      )}

      {activeTab === "Assign Servers" && (
        <div className="head-card">
          {/* ALTAR ASSIGNMENT */}
          <h2>Assign Altar Servers for Mass</h2>

          <div className="row">
            <div>
              <label>Date</label>
              <input
                type="date"
                value={altarDate}
                onChange={(e) => setAltarDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <label>Mass Time</label>
              <select
                value={altarTime}
                onChange={(e) => {
                  setAltarTime(e.target.value);
                  if (e.target.value !== "Other") setCustomAltarTime("");
                }}
              >
                <option value="">Select Time</option>
                {altarDate && (
                  (new Date(altarDate + "T00:00:00").getDay() === 0 
                    ? ["6:30 AM", "8:00 AM", "10:00 AM"] 
                    : new Date(altarDate + "T00:00:00").getDay() === 6 
                      ? ["6:30 AM", "5:30 PM"] 
                      : ["6:30 AM"]
                  ).map(t => <option key={t} value={t}>{t}</option>)
                )}
                <optgroup label="Other">
                  <option value="Other">Other / Special Time</option>
                </optgroup>
              </select>
              {altarTime === "Other" && (
                <input 
                  type="time" 
                  value={customAltarTime} 
                  onChange={(e) => setCustomAltarTime(e.target.value)}
                  style={{ marginTop: '10px', display: 'block', width: '100%' }}
                />
              )}
            </div>
          </div>

          <h4>Select Altar Servers (Minimum 2)</h4>

          {/* SEARCH BOX */}
          <input
            className="search-input"
            placeholder="Search altar servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* SERVER LIST */}
          <div className="server-select-list">
            {filteredServers.map(server => (
              <div
                key={server}
                className={`server-item ${
                  assignedServers.includes(server) ? "selected" : ""
                }`}
                onClick={() => toggleServer(server)}
              >
                {server}
              </div>
            ))}
          </div>

          {/* SELECTED PREVIEW */}
          <div className="selected-preview">
            {assignedServers.map(server => (
              <span key={server} className="selected-chip">
                {server}
              </span>
            ))}
          </div>

          <div style={{display: 'flex', gap: '10px'}}>
            <button className="primary-btn" style={{flex: 2}} onClick={handleAltarAssign}>
              {editingId ? "Update Assignment" : "Assign Servers"}
            </button>
            {editingId && <button className="secondary-btn" style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}} onClick={() => {setEditingId(null); setAltarDate(""); setAltarTime(""); setCustomAltarTime(""); setAssignedServers([]);}}>Cancel</button>}
          </div>

          <hr className="section-divider" style={{margin: '30px 0'}} />

          <h3>Scheduled Duties</h3>
          <div className="assignments-list" style={{marginTop: '15px'}}>
            {altarAssignments.map((duty) => (
              <div key={duty._id} style={{
                background: '#f9f9f9', padding: '15px', borderRadius: '10px', marginBottom: '15px', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #6c4ab6'
              }}>
                <div>
                  <p style={{fontWeight: 'bold', margin: '0'}}>{new Date(duty.date).toDateString()} at {duty.time}</p>
                  <p style={{margin: '5px 0 0 0', fontSize: '0.9rem', color: '#666'}}>
                    Servers: {duty.servers.join(", ")}
                  </p>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button 
                    onClick={() => handleEditAssignment(duty)}
                    style={{padding: '6px 12px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >Edit</button>
                  <button 
                    onClick={() => handleDeleteAssignment(duty._id)}
                    style={{padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >Delete</button>
                </div>
              </div>
            ))}
            {altarAssignments.length === 0 && <p style={{color: '#999', fontStyle: 'italic'}}>No duties scheduled yet.</p>}
          </div>
        </div>
      )}

      {/* GALLERY */}
      {activeTab === "Parish Gallery" && (
        <div className="head-card">
          <h2>Manage Parish Gallery</h2>
          <div style={{ marginBottom: '20px', border: '2px dashed #ddd', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <input type="file" accept="image/*" onChange={handleImageChange} id="fileInput" style={{ display: 'none' }} />
            <label htmlFor="fileInput" style={{ cursor: 'pointer', color: '#6c4ab6', fontWeight: 'bold' }}>
              {selectedImage ? "Change Selected Image" : "Click to Select Photo"}
            </label>
            
            {selectedImage && (
              <div style={{ marginTop: '15px' }}>
                <img src={selectedImage} alt="Preview" style={{ maxWidth: '300px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                <input 
                  placeholder="Add a caption for this memory..." 
                  value={imageCaption} 
                  onChange={(e) => setImageCaption(e.target.value)} 
                  style={{ marginTop: '15px', padding: '10px', width: '80%', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
            )}
          </div>
          <button className="primary-btn" style={{ width: '100%' }} onClick={handleUploadPhoto}>Upload to Gallery</button>

          <hr className="section-divider" style={{ margin: '40px 0' }} />
          <h3>Live Gallery Stream</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {galleryItems.map(item => (
              <div key={item._id} className="gallery-item-container">
                <img src={item.image} alt={item.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="gallery-overlay">
                  <p className="gallery-caption">{item.caption || "Untitled"}</p>
                  <small className="gallery-date">{new Date(item.date).toLocaleDateString()}</small>
                  <button className="delete-photo-btn" onClick={() => handleDeletePhoto(item._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEMBERS */}
      {activeTab === "Manage Members" && (
        <div className="head-card">
          <h2>Altar Servers</h2>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {altarServers.map((member, index) => (
                <tr key={index}>
                  <td>{member}</td>
                  <td>Altar Server</td>
                  <td>+91 98765432{index}</td>
                  <td>
                    <button className="edit-btn">Edit</button>
                    <button className="delete-btn">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', padding: '12px 25px',
          borderRadius: '8px', color: 'white', backgroundColor: notification.type === 'error' ? '#f44336' : '#4caf50',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 2000, transition: 'all 0.3s ease'
        }}>
          {notification.msg}
        </div>
      )}

    </div>
  );
};

export default AltarHeadDashboard;