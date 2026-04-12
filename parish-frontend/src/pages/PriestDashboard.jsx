import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./PriestDashboard.css";
import BackButton from "../components/BackButton";
import CommunityChat from "./CommunityChat";
import LoadingOverlay from "../components/LoadingOverlay";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

const PriestDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Announcements");
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [sacramentFilter, setSacramentFilter] = useState({ startDate: '', endDate: '', types: [], sortOrder: 'desc' });
  const [familyFilter, setFamilyFilter] = useState({ memberCount: '' });
  
  const [records, setRecords] = useState([]);
  const [families, setFamilies] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [altarAssignments, setAltarAssignments] = useState([]);
  const [lectorAssignments, setLectorAssignments] = useState([]);
  const [expandedAssignment, setExpandedAssignment] = useState(null);
  const [donationOptions, setDonationOptions] = useState([]);
  const [massBookings, setMassBookings] = useState([]);
  const [donations, setDonations] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageCaption, setImageCaption] = useState("");
  const [notification, setNotification] = useState(null);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [chatView, setChatView] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  
  useEffect(() => {
    const priestId = localStorage.getItem("familyId");
    if (priestId !== "PRIEST") {
      navigate("/login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        const responses = await Promise.all([
          fetch(`${API_BASE}/records`),
          fetch(`${API_BASE}/families`),
          fetch(`${API_BASE}/communities`),
          fetch(`${API_BASE}/donation-options`),
          fetch(`${API_BASE}/mass-bookings`),
          fetch(`${API_BASE}/donations`),
          fetch(`${API_BASE}/gallery`),
          fetch(`${API_BASE}/altar-assignments`),
          fetch(`${API_BASE}/lector-assignments`)
        ]);

        if (responses[0].ok) setRecords(await responses[0].json());
        if (responses[1].ok) setFamilies(await responses[1].json());
        if (responses[2].ok) setCommunities(await responses[2].json());
        if (responses[3].ok) {
          setDonationOptions(await responses[3].json());
        } else {
          setDonationOptions([
            { name: "To the Church", desc: "General maintenance and operations." },
            { name: "To Pilar Church", desc: "Support for sister parish missions." },
            { name: "Good Samaritan Fund", desc: "Assistance for the needy in our community." }
          ]);
        }
        if (responses[4].ok) setMassBookings(await responses[4].json());
        if (responses[5].ok) setDonations(await responses[5].json());
        if (responses[6].ok) setGalleryItems(await responses[6].json());
        if (responses[7].ok) setAltarAssignments(await responses[7].json());
        if (responses[8].ok) setLectorAssignments(await responses[8].json());
        
        setIsLoading(false);
      } catch (_err) {
        console.error("Error loading priest dashboard");
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  useEffect(() => {
    loadRecords();
    loadFamilies();
    loadCommunities();
    loadDonationOptions();
    loadMassBookings();
    loadDonations();
    loadGallery();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await fetch(`${API_BASE}/records`);
      if (!response.ok) throw new Error("Unable to load records");
      const data = await response.json();
      setRecords(data);
    } catch (_err) {
      setFetchError("Could not load records");
    }
  };

  const loadFamilies = async () => {
    try {
      const response = await fetch(`${API_BASE}/families`);
      if (!response.ok) throw new Error("Unable to load families");
      const data = await response.json();
      setFamilies(data);
    } catch (_err) {
      showNotify("Could not load families", "error");
    }
  };

  const loadCommunities = async () => {
    try {
      const response = await fetch(`${API_BASE}/communities`);
      if (response.ok) {
        const data = await response.json();
        setCommunities(data);
      }
    } catch (_err) {
      setCommunities([]);
    }
  };

  const loadDonationOptions = async () => {
    try {
      const response = await fetch(`${API_BASE}/donation-options`);
      if (response.ok) {
        const data = await response.json();
        setDonationOptions(data);
      } else {
        setDonationOptions([
          { name: "To the Church", desc: "General maintenance and operations." },
          { name: "To Pilar Church", desc: "Support for sister parish missions." },
          { name: "Good Samaritan Fund", desc: "Assistance for the needy in our community." }
        ]);
      }
    } catch (_err) {
      setDonationOptions([]);
    }
  };

  const loadMassBookings = async () => {
    try {
      const response = await fetch(`${API_BASE}/mass-bookings`);
      if (!response.ok) throw new Error("Unable to load mass bookings");
      const data = await response.json();
      setMassBookings(data);
    } catch (_err) {
      showNotify("Could not load mass bookings", "error");
    }
  };

  const loadDonations = async () => {
    try {
      const response = await fetch(`${API_BASE}/donations`);
      if (!response.ok) throw new Error("Unable to load donations");
      const data = await response.json();
      setDonations(data);
    } catch (_err) {
      showNotify("Could not load donations", "error");
    }
  };

  const loadGallery = async () => {
    try {
      const response = await fetch(`${API_BASE}/gallery`);
      if (response.ok) {
        const data = await response.json();
        setGalleryItems(data);
      }
    } catch (_err) {
      console.log("Gallery not available");
    }
  };

  const showNotify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
          category: "Parish Priest",
          date: new Date().toISOString().slice(0, 10),
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

const formatDateForExport = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `\t${day}/${month}/${year}`;
  } catch (_err) {
    return dateStr;
  }
};

const formatPhoneForExport = (phone) => {
  if (!phone) return '';
  return `\t${phone}`;
};


  const handleExport = () => {
    let dataToExport = [];
    let filename = "export.csv";
    let headers = [];

    if (activeTab === "Sacrament Records") {
      headers = ["Type", "Person Name", "Family ID", "Date"];
      dataToExport = records.map(r => [
        r.type || "",
        r.name || "",
        r.familyId || "N/A",
        formatDateForExport(r.date)
      ]);
      filename = "sacrament_records.csv";
    } else if (activeTab === "Families") {
      headers = ["Family ID", "Head", "Phone", "Members Count"];
      dataToExport = families.map(f => [
        f.familyId || "",
        f.head || "",
        formatPhoneForExport(f.phone),
        f.members?.length || 0
      ]);
      filename = "families.csv";
    } else if (activeTab === "Mass Bookings") {
      headers = ["Date", "Time", "Name", "Contact", "Status"];
      dataToExport = massBookings.map(b => [
        formatDateForExport(b.date),
        b.time || "",
        b.name || "",
        formatPhoneForExport(b.phone),
        b.status || ""
      ]);
      filename = "mass_bookings.csv";
    } else if (activeTab === "Donations Received") {
      headers = ["Date", "Donor", "Amount", "Target"];
      dataToExport = donations.map(d => [
        formatDateForExport(d.date),
        d.donorName || "",
        d.amount || 0,
        d.target || ""
      ]);
      filename = "donations.csv";
    }

    if (dataToExport.length === 0) {
      showNotify("No data to export", "error");
      return;
    }

    // Create CSV content with BOM for Excel compatibility
    const csvContent = "\uFEFF" + [
      headers.map(h => `"${h}"`).join(","),
      ...dataToExport.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotify(`Exported ${dataToExport.length} rows to CSV`);
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      const res = await fetch(`${API_BASE}/gallery/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGalleryItems(galleryItems.filter(item => item._id !== id));
        showNotify("Photo deleted");
      }
    } catch (_err) {
      showNotify("Delete failed", "error");
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
        loadGallery();
      }
    } catch (_err) {
      showNotify("Upload failed", "error");
    }
  };

  // Apply filters
  let filteredRecords = records;
  if (search) {
    filteredRecords = filteredRecords.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()));
  }
  if (sacramentFilter.startDate) {
    filteredRecords = filteredRecords.filter(r => new Date(r.date) >= new Date(sacramentFilter.startDate));
  }
  if (sacramentFilter.endDate) {
    filteredRecords = filteredRecords.filter(r => new Date(r.date) <= new Date(sacramentFilter.endDate));
  }
  if (sacramentFilter.types.length > 0) {
    filteredRecords = filteredRecords.filter(r => sacramentFilter.types.includes(r.type));
  }

  let filteredFamilies = families;
  if (search) {
    filteredFamilies = filteredFamilies.filter(f => f.head?.toLowerCase().includes(search.toLowerCase()) || f.familyId?.toLowerCase().includes(search.toLowerCase()));
  }
  if (familyFilter.memberCount) {
    filteredFamilies = filteredFamilies.filter(f => (f.members?.length || 0) >= parseInt(familyFilter.memberCount));
  }

  let filteredMassBookings = massBookings;
  if (search) {
    filteredMassBookings = filteredMassBookings.filter(b => b.name?.toLowerCase().includes(search.toLowerCase()));
  }

  let filteredDonations = donations;
  if (search) {
    filteredDonations = filteredDonations.filter(d => d.donorName?.toLowerCase().includes(search.toLowerCase()));
  }

  if (chatView) {
    return (
      <CommunityChat communityName={chatView} />
    );
  }

  return (
    <div className="priest-container">
      <LoadingOverlay isLoading={isLoading} message="Loading priest dashboard..." />
      <div className="priest-header">
        <div>
          <BackButton />
          <h1>Diocese Priest Dashboard</h1>
        </div>
        <div className="header-buttons">
          <Link to="/community-chats">
            <button className="chat-btn" style={{ marginRight: '10px', background: '#6c4ab6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer' }}>
              Community Chat
            </button>
          </Link>
          
        </div>
      </div>

      <div className="priest-tabs">
        {["Announcements", "Sacrament Records", "Families", "Communities", "Donation Options", "Mass Bookings", "Donations Received", "Parish Gallery"].map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? "active-tab" : ""}
            onClick={() => { setActiveTab(tab); setView("list"); setSearch(""); }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="priest-content">

        {/* ANNOUNCEMENTS */}
        {activeTab === "Announcements" && (
          <div className="priest-card">
            <h3>Post Parish Announcement</h3>
            
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Title</label>
            <input
              placeholder="e.g., Parish Gathering Notice"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Message</label>
            <textarea
              placeholder="Details about the announcement..."
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              rows="5"
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />

            <button
              onClick={handlePostAnnouncement}
              style={{ padding: '10px 20px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              Post Announcement
            </button>
          </div>
        )}

        {/* SACRAMENT RECORDS */}
        {activeTab === "Sacrament Records" && view === "list" && (
          <div className="priest-card">
            <div className="records-header">
              <h3>Archival Parish Records</h3>
              <p className="sub">Manage and view life event records.</p>
            </div>
            <div className="search-actions">
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <button className="filter-btn" onClick={() => setShowFilterPopup(!showFilterPopup)}>Filters</button>
              <button className="export-btn" onClick={handleExport}>Export</button>
            </div>

            {showFilterPopup && (
              <div className="filter-popup">
                <h4>Filters</h4>
                <label>Start Date: <input type="date" value={sacramentFilter.startDate} onChange={(e) => setSacramentFilter({...sacramentFilter, startDate: e.target.value})} /></label>
                <label>End Date: <input type="date" value={sacramentFilter.endDate} onChange={(e) => setSacramentFilter({...sacramentFilter, endDate: e.target.value})} /></label>
                <label>Types:
                  {["Baptism", "Confirmation", "Marriage", "First Holy Communion", "Holy Orders"].map(type => (
                    <label key={type} style={{ display: 'block', marginTop: '5px' }}>
                      <input type="checkbox" checked={sacramentFilter.types.includes(type)} onChange={(e) => {
                        if (e.target.checked) {
                          setSacramentFilter({...sacramentFilter, types: [...sacramentFilter.types, type]});
                        } else {
                          setSacramentFilter({...sacramentFilter, types: sacramentFilter.types.filter(t => t !== type)});
                        }
                      }} />
                      {type}
                    </label>
                  ))}
                </label>
                <button onClick={() => setSacramentFilter({ startDate: '', endDate: '', types: [], sortOrder: 'desc' })}>Clear Filters</button>
              </div>
            )}

            <table className="priest-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Person Name</th>
                  <th>Family ID</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => (
                  <tr key={r._id || r.id}>
                    <td>{r.type}</td>
                    <td>{r.name}</td>
                    <td>{r.familyId || "N/A"}</td>
                    <td>{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FAMILIES */}
        {activeTab === "Families" && view === "list" && (
          <div className="priest-card">
            <div className="records-header">
              <h3>Parish Families</h3>
              <p className="sub">View and search family records.</p>
            </div>
            <div className="search-actions">
              <input
                type="text"
                placeholder="Search by head name or Family ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <button className="export-btn" onClick={handleExport}>Export</button>
            </div>

            <table className="priest-table">
              <thead>
                <tr>
                  <th>Family ID</th>
                  <th>Head</th>
                  <th>Phone</th>
                  <th>Members Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredFamilies.map(f => (
                  <tr key={f._id}>
                    <td>{f.familyId}</td>
                    <td>{f.head || "—"}</td>
                    <td>{f.phone}</td>
                    <td>{f.members?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* COMMUNITIES */}
        {activeTab === "Communities" && (
          <div className="priest-card">
            <h3>Community Members by Ministry</h3>
              
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="priest-card" style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                  <h4>Altar Servers</h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {families.flatMap(f => f.members?.filter(m => m.community?.toLowerCase() === "altar")) && families.flatMap(f => f.members?.filter(m => m.community?.toLowerCase() === "altar")).length > 0 ? (
                      <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        {families.flatMap(f => f.members?.filter(m => m.community?.toLowerCase() === "altar")).map((m, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{m.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: '#999' }}>No altar servers listed</p>
                    )}
                  </div>
                </div>

                <div className="priest-card" style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                  <h4>Lectors</h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {families.flatMap(f => f.members?.filter(m => m.community?.toLowerCase() === "lector")) && families.flatMap(f => f.members?.filter(m => m.community?.toLowerCase() === "lector")).length > 0 ? (
                      <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        {families.flatMap(f => f.members?.filter(m => m.community?.toLowerCase() === "lector")).map((m, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{m.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: '#999' }}>No lectors listed</p>
                    )}
                  </div>
                </div>
              </div>

              <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />

              <h3 style={{ marginTop: '30px' }}>Upcoming Mass Assignments</h3>
              <div style={{ marginTop: '15px' }}>
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const upcomingAssignments = [...altarAssignments, ...lectorAssignments]
                    .filter(a => new Date(a.date) >= today)
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date} ${a.time}`);
                      const dateB = new Date(`${b.date} ${b.time}`);
                      return dateA - dateB;
                    });

                  if (upcomingAssignments.length === 0) {
                    return <p style={{ color: '#999' }}>No upcoming mass assignments</p>;
                  }

                  return (
                    <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                      {upcomingAssignments.map((assignment) => {
                        const isAltar = altarAssignments.some(alt => alt._id === assignment._id);
                        const assignmentKey = `${assignment.date}-${assignment.time}-${isAltar ? 'altar' : 'lector'}`;
                        const isExpanded = expandedAssignment === assignmentKey;

                        return (
                          <li key={assignmentKey} style={{ marginBottom: '12px', borderLeft: '3px solid #6c4ab6', paddingLeft: '15px' }}>
                            <div
                              onClick={() => setExpandedAssignment(isExpanded ? null : assignmentKey)}
                              style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '6px',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            >
                              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#6c4ab6' }}>
                                {isExpanded ? '▼' : '▶'}
                              </span>
                              <div style={{ flex: 1 }}>
                                <strong>{assignment.date}</strong> at <strong>{assignment.time}</strong>
                                <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#666' }}>
                                  ({isAltar ? 'Altar Servers' : 'Lectors'})
                                </span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div style={{ marginTop: '10px', paddingLeft: '15px', backgroundColor: '#f9f9f9', borderRadius: '6px', padding: '12px' }}>
                                <strong style={{ display: 'block', marginBottom: '8px' }}>Assigned Members:</strong>
                                {assignment.assignedServers && assignment.assignedServers.length > 0 ? (
                                  <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                    {assignment.assignedServers.map((member, memberIdx) => (
                                      <li key={memberIdx} style={{ marginBottom: '6px' }}>{member}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p style={{ color: '#999', margin: '0' }}>No members assigned</p>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()}
              </div>

              <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />

              <h3 style={{ marginTop: '30px' }}>Past Mass Assignments</h3>
              <div style={{ marginTop: '15px' }}>
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const pastAssignments = [...altarAssignments, ...lectorAssignments]
                    .filter(a => new Date(a.date) < today)
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date} ${a.time}`);
                      const dateB = new Date(`${b.date} ${b.time}`);
                      return dateB - dateA;
                    });

                  if (pastAssignments.length === 0) {
                    return <p style={{ color: '#999' }}>No past mass assignments</p>;
                  }

                  return (
                    <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                      {pastAssignments.map((assignment) => {
                        const isAltar = altarAssignments.some(alt => alt._id === assignment._id);
                        return (
                          <li key={`past-${assignment._id}`} style={{ marginBottom: '12px', borderLeft: '3px solid #ccc', paddingLeft: '15px', opacity: 0.7 }}>
                            <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                              <strong>{assignment.date}</strong> at <strong>{assignment.time}</strong>
                              <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#999' }}>
                                ({isAltar ? 'Altar Servers' : 'Lectors'})
                              </span>
                              {assignment.assignedServers && assignment.assignedServers.length > 0 && (
                                <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666' }}>
                                  Members: {assignment.assignedServers.join(', ')}
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* DONATION OPTIONS */}
        {activeTab === "Donation Options" && (
          <div className="priest-card">
            <h3>Donation Options</h3>
            <table className="priest-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {donationOptions.map((d, i) => (
                  <tr key={i}>
                    <td>{d.name}</td>
                    <td>{d.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MASS BOOKINGS */}
        {activeTab === "Mass Bookings" && (
          <div className="priest-card">
            <div className="records-header">
              <h3>Mass Bookings</h3>
              <p className="sub">View scheduled mass bookings.</p>
            </div>
            <div className="search-actions">
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <button className="export-btn" onClick={handleExport}>Export</button>
            </div>

            <table className="priest-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMassBookings.map(b => (
                  <tr key={b._id}>
                    <td>{formatDateForExport(b.date)}</td>
                    <td>{b.time}</td>
                    <td>{b.name}</td>
                    <td>{b.phone}</td>
                    <td>{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DONATIONS RECEIVED */}
        {activeTab === "Donations Received" && (
          <div className="priest-card">
            <div className="records-header">
              <h3>Donations Received</h3>
              <p className="sub">View parish donations.</p>
            </div>
            <div className="search-actions">
              <input
                type="text"
                placeholder="Search by donor name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <button className="export-btn" onClick={handleExport}>Export</button>
            </div>

            <table className="priest-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Donor</th>
                  <th>Amount</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map(d => (
                  <tr key={d._id}>
                    <td>{formatDateForExport(d.date)}</td>
                    <td>{d.donorName}</td>
                    <td>₹{d.amount}</td>
                    <td>{d.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PARISH GALLERY */}
        {activeTab === "Parish Gallery" && (
          <div className="priest-card">
            <h3>Parish Gallery</h3>
            <div style={{ marginBottom: '20px', border: '2px dashed #ddd', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <input type="file" accept="image/*" onChange={handleImageChange} id="fileInputPriest" style={{ display: 'none' }} />
              <label htmlFor="fileInputPriest" style={{ cursor: 'pointer', color: '#6c4ab6', fontWeight: 'bold' }}>
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
            <button className="primary-btn" style={{ width: '100%', marginBottom: '20px' }} onClick={handleUploadPhoto}>Upload to Gallery</button>

            <hr style={{ margin: '40px 0' }} />
            <h3>Live Gallery Stream</h3>
            <div className="gallery-grid">
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

        
      </div>

      {/* NOTIFICATION */}
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

export default PriestDashboard;
