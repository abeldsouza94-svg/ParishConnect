import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./LectorHeadDashboard.css";
import CommunityChat from "./CommunityChat";
import BackButton from "../components/BackButton";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

const LectorHeadDashboard = () => {

  const [activeTab, setActiveTab] = useState("Announcements");

  const [members, setMembers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [lectorAssignments, setLectorAssignments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [customLectorTime, setCustomLectorTime] = useState("");
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageCaption, setImageCaption] = useState("");

  useEffect(() => {
    const loadFamilies = async () => {
      try {
        const response = await fetch(`${API_BASE}/families`);
        if (!response.ok) throw new Error("Unable to load families");
        const families = await response.json();
        const lectors = [];
        families.forEach(family => {
          family.members?.forEach(member => {
            if (member.community?.toLowerCase() === "lector") {
              lectors.push(member.name);
            }
          });
        });
        setMembers(lectors);
      } catch (err) {
        console.error(err);
      }
    };
    loadFamilies();
    fetchAssignments();
    fetchGallery();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${API_BASE}/lector-assignments`);
      if (res.ok) setLectorAssignments(await res.json());
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
      lectorAssignments.some(a => a.date === slot.date && a.time === slot.time)
    );

    return 4 - assignedInSlots.length;
  };

  const showNotify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  /* =====================
     ASSIGN READINGS STATE
  ====================== */

  const [readingDate, setReadingDate] = useState("");
  const [massTime, setMassTime] = useState("");

  const [assignments, setAssignments] = useState([
    { type: "First Reading", person: "", custom: "", search: "" }
  ]);

  /* ADD NEW READING */
  const addReading = () => {
    const uniqueTypes = ["First Reading", "Second Reading"];
    const usedTypes = assignments.map(a => a.type);

    // Guide the user through the standard sequence, but skip unique types already used
    let nextType = "Custom";
    if (!usedTypes.includes("First Reading")) nextType = "First Reading";
    else if (!usedTypes.includes("Responsorial Psalm")) nextType = "Responsorial Psalm";
    else if (!usedTypes.includes("Second Reading")) nextType = "Second Reading";
    else if (!usedTypes.includes("Prayer of the Faithful")) nextType = "Prayer of the Faithful";

    setAssignments([
      ...assignments,
      { type: nextType, person: "", custom: "", search: "" }
    ]);
  };

  /* UPDATE FIELD */
  const updateAssignment = (index, field, value) => {
    const updated = [...assignments];
    updated[index][field] = value;
    setAssignments(updated);
  };

  /* SELECT PERSON */
  const selectPerson = (index, name) => {
    const updated = [...assignments];
    updated[index].person = name;
    updated[index].search = "";
    setAssignments(updated);
  };

  /* SAVE */
  const handleAssign = async () => {
    if (!readingDate || !massTime) {
      showNotify("Please select date and time", "error");
      return;
    }

    const finalTime = massTime === "Other" ? customLectorTime : massTime;
    const payload = { date: readingDate, time: finalTime, readings: assignments };

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_BASE}/lector-assignments/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/lector-assignments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showNotify(editingId ? "Assignments updated" : "Readings Assigned Successfully");
        setReadingDate("");
        setMassTime("");
        setCustomLectorTime("");
        setAssignments([{ type: "First Reading", person: "", custom: "", search: "" }]);
        setEditingId(null);
        fetchAssignments();
      } else {
        throw new Error("Server error");
      }
    } catch (err) { showNotify("Failed to save assignments", "error"); }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    const res = await fetch(`${API_BASE}/lector-assignments/${id}`, { method: "DELETE" });
    if (res.ok) { showNotify("Assignment removed"); fetchAssignments(); }
  };

  const handleEditAssignment = (duty) => {
    const day = new Date(duty.date + "T00:00:00").getDay();
    const standards = day === 0 ? ["6:30 AM", "8:00 AM", "10:00 AM"] : (day === 6 ? ["6:30 AM", "5:30 PM"] : ["6:30 AM"]);

    setReadingDate(duty.date);
    if (standards.includes(duty.time)) {
      setMassTime(duty.time);
      setCustomLectorTime("");
    } else {
      setMassTime("Other");
      setCustomLectorTime(duty.time);
    }
    setAssignments(duty.readings);
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
          category: "Lectors Ministry",
          date: new Date().toISOString().slice(0, 10), // Current date
        }),
      });
      if (!response.ok) throw new Error("Server error");

      showNotify("Announcement Posted Successfully!", "success");
      setAnnouncementTitle("");
      setAnnouncementMessage("");
    } catch (error) {
      console.error("Error posting announcement:", error);
      showNotify("Failed to post announcement.", "error");
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

      {/* HEADER */}
      <div className="head-header">
        <div>
          <BackButton onClick={() => {setActiveTab("Home Management"); setView("list"); setSearch("");}} />
          <h1>Parish Pastoral Council Portal</h1>
          <p>Lectors Ministry Dashboard</p>
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
          <p>Total Lectors</p>
          <h2>{members.length}</h2>
        </div>

        <div className="stat-card">
          <p>Upcoming Masses For The Week</p>
          <h2 style={{color: getUnassignedCount() > 0 ? '#f44336' : '#4caf50'}}>{getUnassignedCount()}</h2>
        </div>

        <div className="stat-card">
          <p>Assignments Done</p>
          <h2>{lectorAssignments.length}</h2>
        </div>
      </div>

      {/* TABS */}
      <div className="head-tabs">
        {[
          "Announcements",
          "Parish Gallery",
          "Manage Members",
          "Assign Readings"
        ].map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? "active-tab" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ANNOUNCEMENTS */}
      {activeTab === "Announcements" && (
        <div className="head-card">
          <h2>Post Parish Announcement</h2>

          <label>Title</label>
          <input
            placeholder="e.g., Mandatory Rehearsal"
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

      {/* GALLERY */}
      {activeTab === "Parish Gallery" && (
        <div className="head-card">
          <h2>Manage Parish Gallery</h2>
          <div style={{ marginBottom: '20px', border: '2px dashed #ddd', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <input type="file" accept="image/*" onChange={handleImageChange} id="fileInputLector" style={{ display: 'none' }} />
            <label htmlFor="fileInputLector" style={{ cursor: 'pointer', color: '#6c4ab6', fontWeight: 'bold' }}>
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
          <h2>Community Members</h2>

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
              {members.map((member, index) => (
                <tr key={index}>
                  <td>{member}</td>
                  <td>Reader</td>
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

      {/* ASSIGN READINGS */}
      {activeTab === "Assign Readings" && (
        <div className="head-card">

          <h2>Assign Mass Readings</h2>

          <div className="row">
            <div>
              <label>Date</label>
              <input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <label>Mass Time</label>
              <select
                value={massTime}
                onChange={(e) => {
                  setMassTime(e.target.value);
                  if (e.target.value !== "Other") setCustomLectorTime("");
                }}
              >
                <option value="">Select Time</option>
                {readingDate && (
                  (new Date(readingDate + "T00:00:00").getDay() === 0 
                    ? ["6:30 AM", "8:00 AM", "10:00 AM"] 
                    : new Date(readingDate + "T00:00:00").getDay() === 6 
                      ? ["6:30 AM", "5:30 PM"] 
                      : ["6:30 AM"]
                  ).map(t => <option key={t} value={t}>{t}</option>)
                )}
                <optgroup label="Other">
                  <option value="Other">Other / Special Time</option>
                </optgroup>
              </select>
              {massTime === "Other" && (
                <input 
                  type="time" 
                  value={customLectorTime} 
                  onChange={(e) => setCustomLectorTime(e.target.value)}
                  style={{ marginTop: '10px', display: 'block', width: '100%' }}
                />
              )}
            </div>
          </div>

          <h4>Readings</h4>

          {assignments.map((item, index) => {

            const filteredMembers = members.filter(m =>
              m.toLowerCase().includes(item.search.toLowerCase())
            );

            return (
              <div key={index} className="reading-row">

                {/* Reading Type */}
                <select
                  value={item.type}
                  onChange={(e) =>
                    updateAssignment(index, "type", e.target.value)
                  }
                >
                  {[
                    "First Reading",
                    "Responsorial Psalm",
                    "Second Reading",
                    "Prayer of the Faithful",
                    "Custom"
                  ].map(t => {
                    const isUnique = ["First Reading", "Second Reading"].includes(t);
                    const isUsed = assignments.some((a, i) => a.type === t && i !== index);
                    return (
                      <option key={t} disabled={isUnique && isUsed}>
                        {t}
                      </option>
                    );
                  })}
                </select>

                {/* Custom */}
                {item.type === "Custom" && (
                  <input
                    placeholder="Custom Reading"
                    value={item.custom}
                    onChange={(e) =>
                      updateAssignment(index, "custom", e.target.value)
                    }
                  />
                )}

                {/* SEARCH PERSON */}
                <div className="lector-selector">

                  <input
                    className="search-input"
                    placeholder="Search lector..."
                    value={item.search}
                    onChange={(e) =>
                      updateAssignment(index, "search", e.target.value)
                    }
                  />

                  <div className="server-select-list" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    {filteredMembers.map(name => {
                      const isAlreadyAssigned = assignments.some((a, i) => a.person === name && i !== index);
                      return (
                        <div
                          key={name}
                          className={`server-item ${
                            item.person === name ? "selected" : ""
                          } ${isAlreadyAssigned ? "frozen" : ""}`}
                          style={isAlreadyAssigned ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                          onClick={() => !isAlreadyAssigned && selectPerson(index, name)}
                        >
                          {name} {isAlreadyAssigned ? "(Already Assigned)" : ""}
                        </div>
                      );
                    })}
                  </div>

                  {item.person && (
                    <div className="selected-chip">
                      Assigned: {item.person}
                    </div>
                  )}

                </div>

              </div>
            );
          })}

          <button className="add-reading-btn" onClick={addReading}>
            + Add Reading
          </button>

          <div style={{display: 'flex', gap: '10px'}}>
            <button className="primary-btn" style={{flex: 2}} onClick={handleAssign}>
              {editingId ? "Update Assignments" : "Save Assignments"}
            </button>
            {editingId && (
              <button 
                className="secondary-btn" 
                style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}} 
                onClick={() => {setEditingId(null); setReadingDate(""); setMassTime(""); setCustomLectorTime(""); setAssignments([{ type: "First Reading", person: "", custom: "", search: "" }]);}}
              >Cancel</button>
            )}
          </div>

          <hr className="section-divider" style={{margin: '30px 0'}} />

          <h3>Scheduled Assignments</h3>
          <div className="assignments-list" style={{marginTop: '15px'}}>
            {lectorAssignments.map((duty) => (
              <div key={duty._id} style={{
                background: '#f9f9f9', padding: '15px', borderRadius: '10px', marginBottom: '15px', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #6c4ab6'
              }}>
                <div>
                  <p style={{fontWeight: 'bold', margin: '0'}}>{new Date(duty.date).toDateString()} at {duty.time}</p>
                  <div style={{margin: '5px 0 0 0', fontSize: '0.85rem', color: '#666'}}>
                    {duty.readings.map((r, i) => <div key={i}>• {r.type}: {r.type === "Custom" ? r.custom : r.person}</div>)}
                  </div>
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
            {lectorAssignments.length === 0 && <p style={{color: '#999', fontStyle: 'italic'}}>No readings assigned yet.</p>}
          </div>
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

export default LectorHeadDashboard;