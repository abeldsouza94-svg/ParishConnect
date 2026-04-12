import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";
import BackButton from "../components/BackButton";
import LoadingOverlay from "../components/LoadingOverlay";
import { API_BASE_URL } from "../config/api";

const API_BASE = API_BASE_URL;

const AdminDashboard = () => {

const [activeTab,setActiveTab] = useState("Sacrament Records");
const [isLoading, setIsLoading] = useState(true);
const [view,setView] = useState("list");
const [search,setSearch] = useState("");
const [sacramentFilter, setSacramentFilter] = useState({ startDate: '', endDate: '', types: [], sortOrder: 'desc' });
const [familyFilter, setFamilyFilter] = useState({ memberCount: '' });
const [massBookingFilter, setMassBookingFilter] = useState({ startDate: '', endDate: '', time: '', status: '' });
const [donationFilter, setDonationFilter] = useState({ fund: '', amount: '', startDate: '', endDate: '' });
const [showFilterPopup, setShowFilterPopup] = useState(false);
const [showSplitPopup, setShowSplitPopup] = useState(false);
const [showRequestPopup, setShowRequestPopup] = useState(false);
const [showSmsPopup, setShowSmsPopup] = useState(false);
const [smsTarget, setSmsTarget] = useState(null);
const [smsMsg, setSmsMsg] = useState("");
const [requestType, setRequestType] = useState(""); // "Edit" or "Delete"
const [requestItem, setRequestItem] = useState(null);
const [requestMessage, setRequestMessage] = useState("");
const [showDeletePopup, setShowDeletePopup] = useState(false);
const [familyToDelete, setFamilyToDelete] = useState(null);
const [nameSuggestions, setNameSuggestions] = useState([]);
const [splittingFamily, setSplittingFamily] = useState(null);
const [notification, setNotification] = useState(null);
const [massBookings, setMassBookings] = useState([]);
const [donations, setDonations] = useState([]);
const [donationOptions, setDonationOptions] = useState([
  { name: "To the Church", desc: "General maintenance and operations." },
  { name: "To Pilar Church", desc: "Support for sister parish missions." },
  { name: "Good Samaritan Fund", desc: "Assistance for the needy in our community." }
]);

const [records,setRecords] = useState([]);
const [families,setFamilies] = useState([]);
const [announcements, setAnnouncements] = useState([]);
const [unavailableDates, setUnavailableDates] = useState([]);
const [galleryItems, setGalleryItems] = useState([]);
const [selectedImage, setSelectedImage] = useState(null);
const [imageCaption, setImageCaption] = useState("");
const [massTimings, setMassTimings] = useState([]);
const [fetchError,setFetchError] = useState("");

const [form,setForm] = useState({});
const [memberForm,setMemberForm] = useState({ name: "", relation: "", rent: "", community: "", birthDate: "", deceased: false });
const [memberList,setMemberList] = useState([]);
const [editingFamily, setEditingFamily] = useState(null);
const [editingDonationIdx, setEditingDonationIdx] = useState(null);
const [editingCommunityIdx, setEditingCommunityIdx] = useState(null);
const [errors, setErrors] = useState({});
const [memberErrors, setMemberErrors] = useState({});
const [confirmPopup, setConfirmPopup] = useState({ show: false, msg: '', onConfirm: () => {} });

const triggerConfirm = (msg, onConfirm) => {
  setConfirmPopup({ show: true, msg, onConfirm });
};

const closeConfirm = () => {
  setConfirmPopup({ show: false, msg: '', onConfirm: () => {} });
};

useEffect(() => {
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [recordsRes, familiesRes, massRes, donationsRes, annRes, massTimingsRes, blockRes, gallRes, communitiesRes] = await Promise.all([
        fetch(`${API_BASE}/records`),
        fetch(`${API_BASE}/families`),
        fetch(`${API_BASE}/mass-bookings`),
        fetch(`${API_BASE}/donations`),
        fetch(`${API_BASE}/announcements`),
        fetch(`${API_BASE}/mass-timings`),
        fetch(`${API_BASE}/unavailable-dates`),
        fetch(`${API_BASE}/gallery`),
        fetch(`${API_BASE}/communities`)
      ]);

      if (recordsRes.ok) setRecords(await recordsRes.json());
      if (familiesRes.ok) setFamilies(await familiesRes.json());
      if (massRes.ok) setMassBookings(await massRes.json());
      if (donationsRes.ok) setDonations(await donationsRes.json());
      if (annRes.ok) setAnnouncements(await annRes.json());
      if (massTimingsRes.ok) setMassTimings(await massTimingsRes.json());
      if (blockRes.ok) setUnavailableDates(await blockRes.json());
      if (gallRes.ok) setGalleryItems(await gallRes.json());
      if (communitiesRes.ok) setCommunities(await communitiesRes.json());
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
      showNotify("Could not load all data from the server.", "error");
      setIsLoading(false);
    }
  };
  
  loadAllData();
}, []);

useEffect(() => {
  const loadRecords = async () => {
    try {
      const response = await fetch(`${API_BASE}/records`);
      if (!response.ok) throw new Error("Unable to load records");
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      console.error(err);
      showNotify("Could not load parish records from the server.", "error");
    }
  };
  loadRecords();
}, []);

useEffect(() => {
  const loadFamilies = async () => {
    try {
      const response = await fetch(`${API_BASE}/families`);
      if (!response.ok) throw new Error("Unable to load families");
      const data = await response.json();
      setFamilies(data);
    } catch (err) {
      console.error(err);
      showNotify("Could not load families from the server.", "error");
    }
  };
  loadFamilies();
}, []);

useEffect(() => {
  const loadMassBookings = async () => {
    try {
      const response = await fetch(`${API_BASE}/mass-bookings`);
      if (!response.ok) throw new Error("Unable to load mass bookings");
      const data = await response.json();
      setMassBookings(data);
    } catch (err) {
      console.error(err);
      showNotify("Could not load mass bookings from the server.", "error");
    }
  };
  loadMassBookings();
}, []);

useEffect(() => {
  const loadDonations = async () => {
    try {
      const response = await fetch(`${API_BASE}/donations`);
      if (!response.ok) throw new Error("Unable to load donations");
      const data = await response.json();
      setDonations(data);
    } catch (err) {
      console.error(err);
      showNotify("Could not load donations from the server.", "error");
    }
  };
  loadDonations();
}, []);

useEffect(() => {
  // Clear any lingering notifications when the active tab changes
  setNotification(null);
}, [activeTab]);
useEffect(() => {
  const loadHomeContent = async () => {
    try {
      const annRes = await fetch(`${API_BASE}/announcements`);
      const massRes = await fetch(`${API_BASE}/mass-timings`);
      const blockRes = await fetch(`${API_BASE}/unavailable-dates`);
      const gallRes = await fetch(`${API_BASE}/gallery`);
      if (annRes.ok) setAnnouncements(await annRes.json());
      if (massRes.ok) setMassTimings(await massRes.json());
      if (blockRes.ok) setUnavailableDates(await blockRes.json());
      if (gallRes.ok) setGalleryItems(await gallRes.json());
    } catch (err) {
      console.error("Error loading home content", err);
    }
  };
  loadHomeContent();
}, []);

// Delete announcement from home page
const handleDeleteAnnouncement = async (id) => {
  triggerConfirm("Are you sure you want to remove this announcement from the home page?", async () => {
    try {
      const res = await fetch(`${API_BASE}/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setAnnouncements(announcements.filter(a => a._id !== id));
      showNotify("Announcement removed from home screen");
    } catch (err) {
      showNotify("Failed to delete announcement", "error");
    }
  });
};

const [massEditId, setMassEditId] = useState(null);
const handleSaveMassTiming = async () => {
  if (!form.day || !form.time) return showNotify("Day and Time required", "error");
  
  const payload = { day: form.day, time: form.time };
  try {
    let res;
    if (massEditId) {
      res = await fetch(`${API_BASE}/mass-timings/${massEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${API_BASE}/mass-timings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) throw new Error();
    const saved = await res.json();
    
    if (massEditId) {
      setMassTimings(massTimings.map(m => m._id === massEditId ? saved : m));
      setMassEditId(null);
    } else {
      setMassTimings([...massTimings, saved]);
    }
    setForm({});
    showNotify("Mass schedule updated");
  } catch (err) {
    showNotify("Failed to update mass timings", "error");
  }
};

const handleDeleteMassTiming = async (id) => {
  triggerConfirm("Are you sure you want to delete this mass timing?", async () => {
    try {
      await fetch(`${API_BASE}/mass-timings/${id}`, { method: "DELETE" });
      setMassTimings(massTimings.filter(m => m._id !== id));
      showNotify("Mass timing deleted");
    } catch (err) {
      showNotify("Error deleting timing", "error");
    }
  });
};

const handleBlockDate = async () => {
  if (!form.blockDate) return showNotify("Please select a date", "error");
  const timeSlot = form.blockTime || "All Day";
  try {
    const res = await fetch(`${API_BASE}/unavailable-dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: form.blockDate, time: timeSlot })
    });
    if (!res.ok) throw new Error();
    const saved = await res.json();
    setUnavailableDates([...unavailableDates, saved]);
    showNotify("Date blocked for bookings");
  } catch (_err) { showNotify("Failed to block date", "error"); }
};

const handleUnblockDate = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/unavailable-dates/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    setUnavailableDates(unavailableDates.filter(d => d._id !== id));
    showNotify("Block removed successfully");
  } catch (err) { showNotify("Failed to unblock date", "error"); }
};

const fetchGallery = async () => {
  try {
    const res = await fetch(`${API_BASE}/gallery`);
    if (res.ok) setGalleryItems(await res.json());
  } catch (err) { console.error("Error fetching gallery", err); }
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
  triggerConfirm("Are you sure you want to delete this photo from the gallery?", async () => {
    try {
      const res = await fetch(`${API_BASE}/gallery/${id}`, { method: "DELETE" });
      if (res.ok) { showNotify("Photo removed from gallery"); fetchGallery(); }
    } catch (err) { showNotify("Delete failed", "error"); }
  });
};

// State for data management
const [communities,setCommunities] = useState([]);

// Form input handling
const handleInputChange = (e)=>{
  setForm({...form,[e.target.name]:e.target.value});
};

const handleMemberInputChange = (e)=>{
  setMemberForm({...memberForm,[e.target.name]:e.target.value});
};

const addFamilyMember = () => {
  let newErrors = {};
  if(!memberForm.name) newErrors.name = "Name required";
  if(!memberForm.relation) newErrors.relation = "Relation required";
  if(!memberForm.community) newErrors.community = "Community required";

  if(Object.keys(newErrors).length > 0) {
    setMemberErrors(newErrors);
    return;
  }

  setMemberList([...memberList, memberForm]);
  setMemberForm({ name: "", relation: "", community: "", birthDate: "", deceased: false });
  setMemberErrors({});
};

const removeFamilyMember = (index) => {
  setMemberList(memberList.filter((_, i) => i !== index));
};

const editFamilyMember = (index) => {
  const member = memberList[index];
  setMemberForm({ ...member, birthDate: member.birthDate || "", deceased: member.deceased || false });
  setMemberList(memberList.filter((_, i) => i !== index));
  // Scroll to member input section
  setTimeout(() => {
    document.querySelector('.member-input-row')?.scrollIntoView({ behavior: 'smooth' });
  }, 0);
};

const getNextFamilyId = () => {
  const nextFamilyNumber = families.reduce((max, f) => {
    const match = f.familyId?.match(/^FAM(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0) + 1;
  return `FAM${nextFamilyNumber.toString().padStart(2, "0")}`;
};

const handleNameSearch = (e) => {
  const val = e.target.value;
  setForm({ ...form, name: val });
  
  if (val.length > 0) {
    const matches = [];
    families.forEach(f => {
      f.members?.forEach(m => {
        if (m.name.toLowerCase().includes(val.toLowerCase())) {
          matches.push({ name: m.name, familyId: f.familyId, head: f.head });
        }
      });
    });
    // Limit to 2 suggestions as requested
    setNameSuggestions(matches.slice(0, 2));
  } else {
    setNameSuggestions([]);
  }
};

const handleSelectSuggestion = (s) => {
  setForm({ ...form, name: s.name, familyId: s.familyId, headName: s.head });
  setNameSuggestions([]);
};

// Get list of already assigned sacraments for the current person
const getAssignedSacraments = () => {
  if (!form.name) return [];
  return records
    .filter(r => r.name === form.name && r._id !== form._id) // Exclude current record being edited
    .map(r => r.type);
};

const handleEditFamily = (family) => {
  const headMember = family.members?.find(m => m.relation === "Head");
  setForm({
    familyId: family.familyId,
    head: family.head,
    phone: family.phone,
    password: family.password || "familypass",
    community: headMember?.community || ""
  });
  setMemberList(family.members?.filter(m => m.relation !== "Head")?.map(m => ({ ...m, birthDate: m.birthDate || "", deceased: m.deceased || false })) || []);
  setEditingFamily(family._id);
  setView("add");
};

const generateRandomPassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  setForm(prev => ({ ...prev, password: result }));
};

const showNotify = (msg, type = "success") => {
  setNotification({ msg, type });
  setTimeout(() => setNotification(null), 3000);
};

const handleSplitFamilyInitiate = (family) => {
  setSplittingFamily(family);
  setShowSplitPopup(true);
};

const handleConfirmSplit = async (memberIndex) => {
  if (!splittingFamily) return;

  const memberToPromote = splittingFamily.members[memberIndex];
  const updatedParentMembers = splittingFamily.members.filter((_, i) => i !== memberIndex);

  const subFamilies = families.filter(f => f.familyId?.startsWith(`${splittingFamily.familyId}/`));
  const newFamilyId = `${splittingFamily.familyId}/${subFamilies.length + 1}`;

  const newFamilyPayload = {
    familyId: newFamilyId,
    head: memberToPromote.name,
    phone: splittingFamily.phone, 
    members: [{ name: memberToPromote.name, relation: "Head", community: memberToPromote.community || "" }]
  };

  try {
    const postRes = await fetch(`${API_BASE}/families`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFamilyPayload)
    });
    if (!postRes.ok) throw new Error("Split failed at creation");
    const newFam = await postRes.json();

    const putRes = await fetch(`${API_BASE}/families/${splittingFamily._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...splittingFamily, members: updatedParentMembers })
    });
    if (!putRes.ok) throw new Error("Split failed at parent update");
    const updatedParent = await putRes.json();

    setFamilies(families.map(f => f._id === splittingFamily._id ? updatedParent : f).concat(newFam));
    setShowSplitPopup(false);
    setSplittingFamily(null);
    showNotify(`Success: ${memberToPromote.name} is now head of sub-family ${newFamilyId}`);
  } catch (err) {
    console.error(err);
    showNotify("An error occurred while splitting the family.", "error");
  }
};

const handleDeleteInitiate = (family) => {
  setFamilyToDelete(family);
  setShowDeletePopup(true);
};

const handleConfirmDelete = async () => {
  if (!familyToDelete) return;
  try {
    const response = await fetch(`${API_BASE}/families/${familyToDelete._id}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Could not delete family");
    setFamilies(families.filter(item => item._id !== familyToDelete._id));
    showNotify("Family deleted successfully");
  } catch (err) {
    console.error(err);
    showNotify("Unable to delete the family.", "error");
  } finally {
    setShowDeletePopup(false);
    setFamilyToDelete(null);
  }
};

/* ADD RECORD */

const handleSaveRecord = async ()=>{
  if(!form.name || !form.type){
    setErrors({
      name:!form.name?"Name required":"",
      type:!form.type?"Type required":""
    });
    return;
  }

  const payload = {
    type: form.type,
    name: form.name,
    familyId: form.familyId || "",
    date: form.date || new Date().toISOString().slice(0,10)
  };

  // Add godfather and godmother for baptism records
  if(form.type === "Baptism") {
    payload.godfather = form.godfather || "";
    payload.godmother = form.godmother || "";
  }

  try {
    if (form._id) {
      // For editing: Delete old record and create new one
      await fetch(`${API_BASE}/records/${form._id}`, { method: "DELETE" });
      
      const response = await fetch(`${API_BASE}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error("Could not save record");
      
      const saved = await response.json();
      setRecords(prev => prev.filter(r => r._id !== form._id).concat(saved));
      showNotify("Record updated");
    } else {
      // Creating new record
      const response = await fetch(`${API_BASE}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error("Could not save record");
      
      const saved = await response.json();
      setRecords(prev => [...prev, saved]);
      showNotify("Record saved");
    }
    
    setView("list");
    setForm({});
    setErrors({});
  } catch (err) {
    console.error(err);
    showNotify("Unable to save the record.", "error");
  }
};

// Handle adding/editing family records
const handleAddFamily = async () => {
  let newErrors = {};
  if(!form.head) newErrors.head = "Head name required";
  if(!form.phone) newErrors.phone = "Phone number required";
  if(form.password && form.password.length !== 8 && form.password !== "familypass") showNotify("Tip: Passwords are usually 8 characters.", "error");

  if(Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  const familyMembers = [
    { name: form.head, relation: "Head", community: form.community || "" },
    ...memberList
  ];

  const payload = {
    familyId: editingFamily ? form.familyId : getNextFamilyId(),
    head: form.head,
    phone: form.phone,
    password: (form.password && form.password.trim() !== "") ? form.password : "familypass",
    members: familyMembers
  };

  try {
    let response;
    if (editingFamily) {
      response = await fetch(`${API_BASE}/families/${editingFamily}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      response = await fetch(`${API_BASE}/families`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) throw new Error("Could not save family");

    const saved = await response.json();
    if (editingFamily) {
      setFamilies(families.map(f => f._id === editingFamily ? saved : f));
      setEditingFamily(null);
    } else {
      setFamilies(prev => [...prev, saved]);
    }

    setView("list");
    setForm({});
    setMemberForm({ name: "", relation: "", community: "", birthDate: "", deceased: false });
    setMemberList([]);
    setErrors({});
  } catch (err) {
    console.error(err);
    setFetchError("Unable to save the family.");
  }
};

/* SAVE COMMUNITY / REQUEST NEW */

const handleRequestInitiate = (type, item) => {
  setRequestType(type);
  setRequestItem(item);
  setRequestMessage("");
  setShowRequestPopup(true);
};

const handleSendEmailRequest = async () => {
  if (!requestMessage.trim()) {
    showNotify("Please enter a message for the request", "error");
    return;
  }

  const targetName = requestItem.name;
  const subject = `Community ${requestType} Request: ${targetName}`;
  const body = `Admin is requesting a ${requestType} for the following community:\n\nCommunity: ${targetName}\nHead: ${requestItem.head}\n\nReason/Notes:\n${requestMessage}`;

  try {
    await fetch(`${API_BASE}/send-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body })
    });
    showNotify("Request sent to developer successfully!");
  } catch (err) {
    showNotify("Failed to send request", "error");
  }
  
  setShowRequestPopup(false);
  setRequestItem(null);
};

const handleSaveCommunity = async () => {
  let newErrors = {};
  if(!form.name) newErrors.name = "Name required";
  if(!form.head) newErrors.head = "Head ID required";
  if(!form.desc) newErrors.desc = "Description required";

  if(Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  if (editingCommunityIdx !== null) {
    const updated = [...communities];
    updated[editingCommunityIdx] = { name: form.name, head: form.head, desc: form.desc };
    setCommunities(updated);
    setEditingCommunityIdx(null);
    showNotify("Community updated successfully");
  } else {
    const subject = `New Community Request: ${form.name}`;
    const body = `Admin is requesting a new community addition:\n\nName: ${form.name}\nHead ID: ${form.head}\nDescription: ${form.desc}`;

    try {
      await fetch(`${API_BASE}/send-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body })
      });
      showNotify("New community request sent to developer!");
    } catch (err) {
      showNotify("Failed to send request", "error");
    }
  }

  setView("list");
  setForm({});
  setErrors({});
};

const handleEditCommunity = (name) => {
  const idx = communities.findIndex(c => c.name === name);
  const c = communities[idx];
  setForm({ name: c.name, head: c.head, desc: c.desc });
  setEditingCommunityIdx(idx);
  setView("add");
};

const handleDeleteCommunity = (name) => {
  setCommunities(communities.filter(c => c.name !== name));
  showNotify("Community removed from list");
};

/* DONATION OPTIONS */

const handleSaveDonationOption = () => {
  let newErrors = {};
  if(!form.name) newErrors.name = "Fund name required";
  if(!form.desc) newErrors.desc = "Description required";

  if(Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  if (editingDonationIdx !== null) {
    const updated = [...donationOptions];
    updated[editingDonationIdx] = { name: form.name, desc: form.desc };
    setDonationOptions(updated);
    setEditingDonationIdx(null);
    showNotify("Donation option updated");
  } else {
    setDonationOptions([
      ...donationOptions,
      { name: form.name, desc: form.desc }
    ]);
    showNotify("New donation option added");
  }

setView("list");
setForm({});
setErrors({});
};

const handleEditDonationOption = (name) => {
  const idx = donationOptions.findIndex(d => d.name === name);
  const opt = donationOptions[idx];
  setForm({ name: opt.name, desc: opt.desc });
  setEditingDonationIdx(idx);
  setView("add");
};

const handleDeleteDonationOption = (name) => {
  triggerConfirm(`Are you sure you want to delete the "${name}" fund?`, () => {
    setDonationOptions(donationOptions.filter(d => d.name !== name));
    showNotify("Donation option removed");
  });
};

const handleSendQuickSms = async () => {
  if(!smsMsg.trim()) return showNotify("Message required", "error");
  try {
    const res = await fetch(`${API_BASE}/send-sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: smsTarget.phone, message: smsMsg })
    });
    const data = await res.json();
    if(res.ok) {
      showNotify(`SMS sent to ${smsTarget.head}'s family`);
      setShowSmsPopup(false);
      setSmsMsg("");
    } else {
      throw new Error(data.error || "Server rejected SMS request");
    }
  } catch (err) { showNotify("Failed to send SMS", "error"); }
};

// Filter records based on search criteria
const filteredRecords = records.filter((r) => {
  const matchesSearch = (r.name?.toLowerCase().includes(search.toLowerCase()) ||
                         r.type?.toLowerCase().includes(search.toLowerCase()) ||
                         r.familyId?.toLowerCase().includes(search.toLowerCase()));

  const recordDate = new Date(r.date);
  const startDate = sacramentFilter.startDate ? new Date(sacramentFilter.startDate) : null;
  const endDate = sacramentFilter.endDate ? new Date(sacramentFilter.endDate) : null;

  const matchesDateRange = (!startDate || recordDate >= startDate) &&
                           (!endDate || recordDate <= endDate);

  const matchesType = sacramentFilter.types.length === 0 || sacramentFilter.types.includes(r.type);

  return matchesSearch && matchesDateRange && matchesType;
}).sort((a, b) => {
  const dateA = new Date(a.date);
  const dateB = new Date(b.date);
  return sacramentFilter.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
});

const filteredFamilies = families.filter((f) => {
  const matchesSearch = (f.head?.toLowerCase().includes(search.toLowerCase()) ||
                         f.familyId?.toLowerCase().includes(search.toLowerCase()) ||
                         f.phone?.toLowerCase().includes(search.toLowerCase()));

  const matchesMemberCount = familyFilter.memberCount === '' ||
                             (f.members?.length || 0) >= parseInt(familyFilter.memberCount, 10);

  return matchesSearch && matchesMemberCount;
});

const filteredCommunities = communities.filter((c) => // Keep general search for these if search bar is visible
  c.name?.toLowerCase().includes(search.toLowerCase()) ||
  c.head?.toLowerCase().includes(search.toLowerCase())
);

const filteredDonationOptions = donationOptions.filter((d) => // Keep general search for these if search bar is visible
  d.name?.toLowerCase().includes(search.toLowerCase()) ||
  d.desc?.toLowerCase().includes(search.toLowerCase())
);

const filteredMassBookings = massBookings.filter((b) => {
  const matchesSearch = (b.name?.toLowerCase().includes(search.toLowerCase()) ||
                         b.intentions?.toLowerCase().includes(search.toLowerCase()));

  const bookingDate = new Date(b.date);
  const startDate = massBookingFilter.startDate ? new Date(massBookingFilter.startDate) : null;
  const endDate = massBookingFilter.endDate ? new Date(massBookingFilter.endDate) : null;

  const matchesDateRange = (!startDate || bookingDate >= startDate) &&
                           (!endDate || bookingDate <= endDate);

  const matchesTime = massBookingFilter.time === '' || b.time === massBookingFilter.time;
  const matchesStatus = massBookingFilter.status === '' || b.status === massBookingFilter.status;

  return matchesSearch && matchesDateRange && matchesTime && matchesStatus;
});

const filteredDonations = donations.filter((d) => {
  const matchesSearch = !search || (d.donorName?.toLowerCase().includes(search.toLowerCase()) ||
                         d.target?.toLowerCase().includes(search.toLowerCase()));

  const donationDate = new Date(d.date);
  const startDate = donationFilter.startDate ? new Date(donationFilter.startDate) : null;
  const endDate = donationFilter.endDate ? new Date(donationFilter.endDate) : null;

  const matchesDateRange = (!startDate || donationDate >= startDate) &&
                           (!endDate || donationDate <= endDate);

  const matchesFund = donationFilter.fund === '' || d.target === donationFilter.fund;
  const matchesAmount = donationFilter.amount === '' || d.amount >= parseInt(donationFilter.amount, 10);

  return matchesSearch && matchesDateRange && matchesFund && matchesAmount;
});

// Format date for export
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
  let fileName = `${activeTab.replace(/\s/g, '_')}_Export.csv`;

  let headers = [];

  if (activeTab === "Sacrament Records") {
    headers = ["Type", "Person Name", "Family ID", "Date"];
    dataToExport = filteredRecords.map(r => [r.type || "", r.name || "", r.familyId || "N/A", formatDateForExport(r.date)]);
  } else if (activeTab === "Families") {
    headers = ["Family ID", "Head", "Phone", "Password", "Members Count", "Members"];
    dataToExport = filteredFamilies.map(f => [
      f.familyId || "", f.head || "", formatPhoneForExport(f.phone), f.password || "familypass", 
      f.members?.length || 0,
      (f.members || []).map(m => `${m.name}(${m.relation})`).join("; ")
    ]);
  } else if (activeTab === "Mass Bookings") {
    headers = ["Name", "Contact", "Address", "Intentions", "Date", "Time", "Status"];
    dataToExport = filteredMassBookings.map(b => [b.name || "", formatPhoneForExport(b.phone), b.address || "", b.intentions || "", formatDateForExport(b.date), b.time || "", b.status || ""]);
  } else if (activeTab === "Donations Received") {
    headers = ["Donor", "Contact", "Address", "Fund", "Amount", "Date", "Status"];
    dataToExport = filteredDonations.map(d => [d.donorName || "", d.donorPhone || "", d.donorAddress || "", d.target || "", d.amount || 0, formatDateForExport(d.date), d.status || ""]);
  }

  if (dataToExport.length === 0) return showNotify("No data matches current filters to export", "error");

  const csvContent = "\uFEFF" + [
    headers.map(h => `"${h}"`).join(","),
    ...dataToExport.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotify(`Exported ${dataToExport.length} rows to Excel/CSV`);
};

return(

<div className="admin-container">

<LoadingOverlay isLoading={isLoading} message="Loading dashboard..." />

{/* HEADER */}

<div className="admin-header">
  <div>
    <BackButton onClick={() => {setActiveTab("Home Management"); setView("list"); setSearch("");}} />
    <h1>Parish Admin Dashboard</h1>
  </div>
  <div className="header-buttons">
    <Link to="/community-chats">
      <button className="chat-btn" style={{ marginRight: '10px', background: '#6c63ff', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer' }}>
        Community Chat
      </button>
    </Link>
    {["Sacrament Records", "Families", "Mass Bookings", "Donations Received"].includes(activeTab) && (
      <button className="export-btn" onClick={handleExport} style={{ marginRight: '10px' }}>
        Export to Excel
      </button>
    )}
    <button className="add-btn" onClick={()=>{setActiveTab("Families"); setView("add"); setEditingFamily(null); setForm({}); setMemberList([]); setMemberForm({ name: "", relation: "", rent: "", community: "", birthDate: "", deceased: false });}}>
      + Add Family
    </button>
  </div>
</div>

{/* STATS */}

<div className="stats">

<div className="card">
<p>Total Families</p>
<h2>{families.length}</h2>
</div>

<div className="card">
<p>Parish Records</p>
<h2>{records.length}</h2>
</div>

<div className="card">
<p>Communities</p>
<h2>{communities.length}</h2>
</div>

<div className="card">
<p>Mass Bookings</p>
<h2>{massBookings.length}</h2>
</div>

</div>

{/* TABS */}

<div className="tabs">

{[
"Sacrament Records",
"Families",
"Communities",
"Donation Options",
"Mass Bookings",
"Donations Received",
"Parish Gallery",
"Home Management"
].map(tab=>(
<button
key={tab}
className={activeTab===tab?"active-tab":""}
onClick={()=>{
setActiveTab(tab);
setView("list");
setSearch("");
}}
>
{tab}
</button>
))}

</div>

{/* SEARCH */}
<div className="search-actions">
  {activeTab !== "Communities" && activeTab !== "Donation Options" && activeTab !== "Home Management" && activeTab !== "Parish Gallery" && (
    <div className="search-section">
      <input
        placeholder={`Search in ${activeTab}...`}
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
      />
      {["Sacrament Records", "Families", "Mass Bookings", "Donations Received"].includes(activeTab) && (
        <button className="filter-btn" onClick={() => setShowFilterPopup(true)}>Filter</button>
      )}
    </div>
  )}
  {["Sacrament Records", "Families", "Communities", "Donation Options"].includes(activeTab) && (
    <button className="new-btn" onClick={() => {
      setEditingDonationIdx(null); setEditingCommunityIdx(null); setErrors({});
      if (activeTab === "Families") {
        setView("add"); setEditingFamily(null); setForm({}); setMemberList([]); setMemberForm({ name: "", relation: "", community: "", birthDate: "", deceased: false });
      } else if (activeTab === "Sacrament Records") {
        setView("add"); setForm({ date: new Date().toISOString().slice(0, 10), type: "", name: "", familyId: "" });
      } else {
        setView("add"); setForm({});
      }
    }}>
      {activeTab === "Families" ? "+ Add Family" : 
       activeTab === "Communities" ? "Request New Community" : 
       activeTab === "Donation Options" ? "+ New Option" : "+ New Record"}
    </button>
  )}
</div>

{/* GENERIC CONFIRMATION POPUP */}
{confirmPopup.show && (
  <div className="filter-popup-overlay" style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center'
  }}>
    <div className="filter-popup-content" style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '350px' }}>
      <h3 style={{margin: '0 0 15px 0', color: '#f44336'}}>Confirm Action</h3>
      <p style={{marginBottom: '20px', color: '#666'}}>{confirmPopup.msg}</p>
      <div style={{display: 'flex', gap: '10px'}}>
        <button 
          style={{flex: 1, padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
          onClick={() => { confirmPopup.onConfirm(); closeConfirm(); }}
        >Confirm</button>
        <button 
          style={{flex: 1, padding: '10px', backgroundColor: '#ddd', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
          onClick={closeConfirm}
        >Cancel</button>
      </div>
    </div>
  </div>
)}

{/* COMMUNITY REQUEST POPUP */}
{showRequestPopup && (
  <div className="filter-popup-overlay" style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2500, display: 'flex', justifyContent: 'center', alignItems: 'center'
  }}>
    <div className="filter-popup-content" style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '450px' }}>
      <h3 style={{margin: '0 0 15px 0', color: '#6c4ab6'}}>Request {requestType}</h3>
      <p style={{marginBottom: '15px', fontSize: '0.9rem'}}>You are requesting to <strong>{requestType.toLowerCase()}</strong> the community: <strong>{requestItem?.name}</strong>.</p>
      
      <label style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>Message to Developer</label>
      <textarea 
        style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '120px', marginBottom: '20px', fontFamily: 'inherit'}}
        placeholder="Explain what changes are needed or why this should be deleted..."
        value={requestMessage}
        onChange={(e) => setRequestMessage(e.target.value)}
      />

      <div style={{display: 'flex', gap: '10px'}}>
        <button 
          className="primary-btn" 
          style={{flex: 2, padding: '12px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
          onClick={handleSendEmailRequest}
        >Send Request Email</button>
        <button 
          style={{flex: 1, padding: '12px', backgroundColor: '#ddd', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
          onClick={() => setShowRequestPopup(false)}
        >Cancel</button>
      </div>
    </div>
  </div>
)}

{/* QUICK SMS POPUP */}
{showSmsPopup && (
  <div className="filter-popup-overlay" style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2500, display: 'flex', justifyContent: 'center', alignItems: 'center'
  }}>
    <div className="filter-popup-content" style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '400px' }}>
      <h3 style={{margin: '0 0 15px 0', color: '#4caf50'}}>Quick SMS</h3>
      <p style={{marginBottom: '15px', fontSize: '0.9rem'}}>Sending to: <strong>{smsTarget?.head}</strong> ({smsTarget?.phone})</p>
      
      <textarea 
        style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', marginBottom: '20px', fontFamily: 'inherit'}}
        placeholder="Type your message here..."
        value={smsMsg}
        onChange={(e) => setSmsMsg(e.target.value)}
      />

      <div style={{display: 'flex', gap: '10px'}}>
        <button 
          className="primary-btn" 
          style={{flex: 2, padding: '12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
          onClick={handleSendQuickSms}
        >Send SMS Now</button>
        <button 
          style={{flex: 1, padding: '12px', backgroundColor: '#ddd', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
          onClick={() => setShowSmsPopup(false)}
        >Cancel</button>
      </div>
    </div>
  </div>
)}

{/* FILTER POPUP */}
{showFilterPopup && (
  <div className="filter-popup-overlay" style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
  }} onClick={() => setShowFilterPopup(false)}>
    <div className="filter-popup-content" style={{
      backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '350px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease'
    }} onClick={(e) => e.stopPropagation()}>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
        <h3 style={{margin: 0, color: '#6c4ab6'}}>Filter {activeTab}</h3>
        <button onClick={() => setShowFilterPopup(false)} style={{background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer'}}>×</button>
      </div>

      {activeTab === "Sacrament Records" && (
        <div className="popup-filter-group">
          <label style={{display:'block', marginBottom: '5px', fontSize: '14px'}}>Date Range</label>
          <input type="date" value={sacramentFilter.startDate} onChange={(e) => setSacramentFilter({ ...sacramentFilter, startDate: e.target.value })} style={{width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd'}} />
          <input type="date" value={sacramentFilter.endDate} onChange={(e) => setSacramentFilter({ ...sacramentFilter, endDate: e.target.value })} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}} />

          <label style={{display:'block', margin: '10px 0 5px', fontSize: '14px'}}>Sacrament Types</label>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px'}}>
            {["Baptism", "First Holy Communion", "Confirmation", "Marriage", "Holy Orders"].map(t => (
              <label key={t} style={{fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>
                <input 
                  type="checkbox" 
                  checked={sacramentFilter.types.includes(t)}
                  onChange={(e) => {
                    const newTypes = e.target.checked 
                      ? [...sacramentFilter.types, t]
                      : sacramentFilter.types.filter(type => type !== t);
                    setSacramentFilter({...sacramentFilter, types: newTypes});
                  }}
                />
                {t}
              </label>
            ))}
          </div>

          <label style={{display:'block', marginBottom: '5px', fontSize: '14px'}}>Sort Order</label>
          <select value={sacramentFilter.sortOrder} onChange={(e) => setSacramentFilter({ ...sacramentFilter, sortOrder: e.target.value })} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}>
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      )}

      {activeTab === "Families" && (
        <div className="popup-filter-group">
          <label style={{display:'block', marginBottom: '5px', fontSize: '14px'}}>Minimum Members</label>
          <input type="number" value={familyFilter.memberCount} onChange={(e) => setFamilyFilter({ ...familyFilter, memberCount: e.target.value })} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}} />
        </div>
      )}

      {activeTab === "Mass Bookings" && (
        <div className="popup-filter-group">
          <label style={{display:'block', marginBottom: '5px', fontSize: '14px'}}>Date Range</label>
          <input type="date" value={massBookingFilter.startDate} onChange={(e) => setMassBookingFilter({ ...massBookingFilter, startDate: e.target.value })} style={{width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd'}} />
          <input type="date" value={massBookingFilter.endDate} onChange={(e) => setMassBookingFilter({ ...massBookingFilter, endDate: e.target.value })} style={{width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd'}} />
          
          <label style={{display:'block', marginBottom: '5px', fontSize: '14px'}}>Time</label>
          <select value={massBookingFilter.time} onChange={(e) => setMassBookingFilter({ ...massBookingFilter, time: e.target.value })} style={{width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd'}}>
            <option value="">All Times</option>
            <option>6:30 AM</option><option>8:00 AM</option><option>10:00 AM</option><option>5:30 PM</option>
          </select>

          <label style={{display:'block', marginBottom: '5px', fontSize: '14px'}}>Status</label>
          <select value={massBookingFilter.status} onChange={(e) => setMassBookingFilter({ ...massBookingFilter, status: e.target.value })} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}>
            <option value="">All Statuses</option>
            <option>Confirmed</option><option>Pending</option><option>Cancelled</option>
          </select>
        </div>
      )}

      {activeTab === "Donations Received" && (
        <div className="popup-filter-group">
          <label style={{display:'block', marginBottom: '5px', fontSize: '14px'}}>Fund</label>
          <select value={donationFilter.fund} onChange={(e) => setDonationFilter({ ...donationFilter, fund: e.target.value })} style={{width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd'}}>
            <option value="">All Funds</option>
            {donationOptions.map((opt, i) => (<option key={i} value={opt.name}>{opt.name}</option>))}
          </select>

          <label style={{display:'block', marginBottom: '5px', fontSize: '14px'}}>Min. Amount (₹)</label>
          <input type="number" value={donationFilter.amount} onChange={(e) => setDonationFilter({ ...donationFilter, amount: e.target.value })} style={{width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd'}} />
          
          <label style={{display:'block', marginBottom: '5px', fontSize: '14px'}}>Date Range</label>
          <input type="date" value={donationFilter.startDate} onChange={(e) => setDonationFilter({ ...donationFilter, startDate: e.target.value })} style={{width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd'}} />
          <input type="date" value={donationFilter.endDate} onChange={(e) => setDonationFilter({ ...donationFilter, endDate: e.target.value })} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}} />
        </div>
      )}

      <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
        <button className="primary-btn" style={{flex: 1, padding: '10px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}} onClick={() => setShowFilterPopup(false)}>Apply Filters</button>
        <button style={{flex: 1, padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}} onClick={() => {
          if(activeTab === "Sacrament Records") setSacramentFilter({ startDate: '', endDate: '', types: [], sortOrder: 'desc' });
          if(activeTab === "Families") setFamilyFilter({ memberCount: '' });
          if(activeTab === "Mass Bookings") setMassBookingFilter({ startDate: '', endDate: '', time: '', status: '' });
          if(activeTab === "Donations Received") setDonationFilter({ fund: '', amount: '', startDate: '', endDate: '' });
          setShowFilterPopup(false);
        }}>Clear All</button>
      </div>
    </div>
  </div>
)}

{/* SPLIT FAMILY POPUP */}
{showSplitPopup && (
  <div className="filter-popup-overlay" style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
  }} onClick={() => setShowSplitPopup(false)}>
    <div className="filter-popup-content" style={{
      backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '400px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease'
    }} onClick={(e) => e.stopPropagation()}>
      <h3 style={{margin: '0 0 15px 0', color: '#6c4ab6'}}>Create Sub-Family</h3>
      <p style={{marginBottom: '15px', fontSize: '0.9rem', color: '#666'}}>Select a member to split from <strong>{splittingFamily?.head}</strong>'s family and create a new head of household.</p>
      
      <div style={{maxHeight: '250px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #eee', borderRadius: '6px'}}>
        {splittingFamily?.members?.filter(m => m.relation !== "Head").map((m, idx) => (
          <div key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee'}}>
            <span>{m.name} ({m.relation})</span>
            <button 
              style={{padding: '5px 10px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'}}
              onClick={() => handleConfirmSplit(splittingFamily.members.indexOf(m))}
            >
              Promote to Head
            </button>
          </div>
        ))}
        {splittingFamily?.members?.filter(m => m.relation !== "Head").length === 0 && <p style={{padding:'10px', textAlign:'center'}}>No members available to split.</p>}
      </div>

      <button className="primary-btn" style={{width: '100%', padding: '10px', backgroundColor: '#ddd', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer'}} onClick={() => setShowSplitPopup(false)}>Cancel</button>
    </div>
  </div>
)}

{/* DELETE CONFIRMATION POPUP */}
{showDeletePopup && (
  <div className="filter-popup-overlay" style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
  }} onClick={() => setShowDeletePopup(false)}>
    <div className="filter-popup-content" style={{
      backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '350px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease'
    }} onClick={(e) => e.stopPropagation()}>
      <h3 style={{margin: '0 0 15px 0', color: '#f44336'}}>Confirm Delete</h3>
      <p style={{marginBottom: '20px', color: '#666', lineHeight: '1.4'}}>Are you sure you want to delete the family headed by <strong>{familyToDelete?.head}</strong>? This will remove all associated member data.</p>
      
      <div style={{display: 'flex', gap: '10px'}}>
        <button 
          style={{flex: 1, padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
          onClick={handleConfirmDelete}
        >
          Delete
        </button>
        <button 
          style={{flex: 1, padding: '10px', backgroundColor: '#ddd', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
          onClick={() => setShowDeletePopup(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

<div className="tab-content">

{/* SACRAMENT RECORDS */}

{activeTab==="Sacrament Records" &&(

view==="list"?(
<div className="records-card">
  <div className="records-header">
    <h3>Archival Parish Records</h3>
    <p className="sub">Manage and link life event records to family accounts.</p>
  </div>

  {fetchError && <p className="error-message">{fetchError}</p>}
  <div className="table-scroll-container" style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #eceefb', borderRadius: '18px' }}>
  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Person Name</th>
        <th>Family ID</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
    </thead>

    <tbody>

{filteredRecords.map(r=>(
<tr key={r._id || r.id}>
<td>{r.type}</td>
<td>{r.name}</td>
<td>{r.familyId || "N/A"}</td>
<td>{r.date}</td>
<td>
  <button 
    className="action-btn edit-btn" 
    style={{ padding: '6px 12px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }} 
    onClick={() => { setForm(r); setView("add"); setNameSuggestions([]); }}>Edit</button>
  <button 
    className="action-btn delete-btn" 
    style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
    onClick={() => { if(window.confirm("Delete this record?")) { fetch(`${API_BASE}/records/${r._id}`, {method:"DELETE"}).then(() => { setRecords(records.filter(x=>x._id!==r._id)); showNotify("Record deleted"); }).catch(() => showNotify("Delete failed", "error")); } }}>Delete</button>
</td>
</tr>
))}

</tbody>

</table>
</div>

</div>
):(

<div className="sacrament-card">

<div className="back-link" onClick={() => { setView("list"); setNameSuggestions([]); }}> X </div>

<h2>{form._id ? "Edit Record" : "Add Record"}</h2>

<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date of Event</label>
<input type="date" name="date" style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' }} value={form.date || ""} onChange={handleInputChange}/>

<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Person Name</label>
<div style={{ position: 'relative', marginBottom: '15px' }}>
  <input 
    type="text" 
    name="name" 
    placeholder="Start typing name..." 
    style={{ padding: '10px', borderRadius: '6px', border: errors.name ? '2px solid red' : '1px solid #ddd', width: '100%', boxSizing: 'border-box' }}
    value={form.name || ""} 
    onChange={handleNameSearch} 
    autoComplete="off"
  />
  {nameSuggestions.length > 0 && (
    <div className="name-suggestions-popup" style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '6px', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      {nameSuggestions.map((s, i) => (
        <div key={i} onClick={() => handleSelectSuggestion(s)} style={{ padding: '10px', cursor: 'pointer', borderBottom: i === 0 ? '1px solid #eee' : 'none', display: 'flex', justifyContent: 'space-between' }}>
          <span>{s.name}</span>
          <small style={{ color: '#6c4ab6' }}>{s.familyId}</small>
        </div>
      ))}
    </div>
  )}
</div>

<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Family ID</label>
<input type="text" name="familyId" value={form.familyId || ""} readOnly style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box', backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}/>
{form.headName && <p style={{ opacity: 0.4, fontSize: '0.85rem', marginTop: '-12px', marginBottom: '15px', fontStyle: 'italic' }}>Linked to Family Head: {form.headName}</p>}

<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Sacrament Type</label>
<select name="type" style={{ padding: '10px', marginBottom: '20px', borderRadius: '6px', border: errors.type ? '2px solid red' : '1px solid #ddd', width: '100%', boxSizing: 'border-box' }} value={form.type || ""} onChange={handleInputChange}>
  <option value="">-- Select Sacrament --</option>
  <option value="Baptism" disabled={getAssignedSacraments().includes("Baptism")}>Baptism {getAssignedSacraments().includes("Baptism") ? "(Already Assigned)" : ""}</option>
  <option value="First Holy Communion" disabled={getAssignedSacraments().includes("First Holy Communion")}>First Holy Communion {getAssignedSacraments().includes("First Holy Communion") ? "(Already Assigned)" : ""}</option>
  <option value="Confirmation" disabled={getAssignedSacraments().includes("Confirmation")}>Confirmation {getAssignedSacraments().includes("Confirmation") ? "(Already Assigned)" : ""}</option>
  <option value="Marriage" disabled={getAssignedSacraments().includes("Marriage")}>Marriage {getAssignedSacraments().includes("Marriage") ? "(Already Assigned)" : ""}</option>
  <option value="Holy Orders" disabled={getAssignedSacraments().includes("Holy Orders")}>Holy Orders {getAssignedSacraments().includes("Holy Orders") ? "(Already Assigned)" : ""}</option>
</select>

{form.type === "Baptism" && (
  <div>
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Godfather Name</label>
    <input 
      type="text" 
      name="godfather" 
      placeholder="Enter godfather name" 
      style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' }}
      value={form.godfather || ""} 
      onChange={handleInputChange}
      autoComplete="off"
    />
    
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Godmother Name</label>
    <input 
      type="text" 
      name="godmother" 
      placeholder="Enter godmother name" 
      style={{ padding: '10px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' }}
      value={form.godmother || ""} 
      onChange={handleInputChange}
      autoComplete="off"
    />
  </div>
)}

<button className="primary-btn" style={{ width: '100%', padding: '12px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }} onClick={handleSaveRecord}>{form._id ? "Save Changes" : "Save Record"}</button>
{form._id && <button className="primary-btn" style={{ width: '100%', marginTop: '10px', backgroundColor: '#ddd', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }} onClick={() => { setView("list"); setForm({}); setNameSuggestions([]); }}>Cancel</button>}

</div>

)
)}

{/* FAMILIES */}

{activeTab==="Families" &&(

view==="list"?(
<div className="table-scroll-container" style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #eceefb', borderRadius: '18px' }}>
<div className="families-list-container">
<table>

<thead>
<tr>
<th>Family ID</th>
<th>Head</th>
<th>Phone</th>
<th>Password</th>
<th>Members</th>
<th>Members Count</th>
<th>Actions</th>
</tr>
</thead>

<tbody>

{filteredFamilies.map((f)=>(
<tr key={f._id}>
<td>{f.familyId}</td>
<td>{f.head || "—"}</td>
<td>{f.phone}</td>
<td style={{fontFamily: 'monospace', color: '#6c4ab6'}}>{f.password || "familypass"}</td>
<td>
  <div style={{ maxHeight: '55px', overflowY: 'auto', paddingRight: '5px', scrollbarWidth: 'thin', border: '1px solid #f0f0f0', borderRadius: '4px', padding: '4px' }}>
    {f.members?.map((m, idx) => (
      <div key={idx} className="member-summary" style={{ fontSize: '0.85rem', marginBottom: '2px', whiteSpace: 'nowrap', opacity: m.deceased ? 0.5 : 1, textDecoration: m.deceased ? 'line-through' : 'none' }}>
        {m.name} ({m.relation}){m.community ? ` • ${m.community}` : ""}
      </div>
    ))}
  </div>
</td>
<td>{f.members?.length || 0}</td>
<td>
  <div className="table-actions" style={{ display: 'flex', gap: '8px' }}>
    <button 
      className="action-btn edit-btn" 
      style={{ padding: '6px 12px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'opacity 0.2s' }}
      onClick={() => handleEditFamily(f)}
    >
      Edit
    </button>
    <button 
      className="action-btn member-btn" 
      style={{ padding: '6px 12px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'opacity 0.2s' }}
      onClick={() => handleEditFamily(f)}
    >
      + Member
    </button>
    <button 
      className="action-btn sms-btn" 
      style={{ padding: '6px 12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'opacity 0.2s' }}
      onClick={() => { setSmsTarget(f); setShowSmsPopup(true); }}
    >
      SMS
    </button>
    <button 
      className="action-btn split-btn" 
      style={{ padding: '6px 12px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'opacity 0.2s' }}
      onClick={() => handleSplitFamilyInitiate(f)}
    >
      Split
    </button>
    <button 
      className="action-btn delete-btn" 
      style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'opacity 0.2s' }}
      onClick={() => handleDeleteInitiate(f)}
    >
      Delete
    </button>
  </div>
</td>
</tr>
))}

</tbody>

</table>
</div>

</div>
):(

<div className="family-card">

<div className="back-link" onClick={()=>setView("list")}> X </div>

<h2>{editingFamily ? "Edit Family" : "Add Family"}</h2>

<div className="family-id-row">
  <label>Family ID</label>
  <span>{editingFamily ? form.familyId : getNextFamilyId()}</span>
</div>

<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Family Head Name</label>
<input type="text" name="head" style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', border: errors.head ? '2px solid red' : '1px solid #ddd', width: '100%', boxSizing: 'border-box' }} value={form.head || ""} onChange={handleInputChange}/>

<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone Number</label>
<input type="text" name="phone" style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', border: errors.phone ? '2px solid red' : '1px solid #ddd', width: '100%', boxSizing: 'border-box' }} value={form.phone || ""} onChange={handleInputChange}/>

<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Community Type</label>
<select name="community" style={{ padding: '10px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' }} value={form.community || ""} onChange={handleInputChange}>
  <option value="">Select Community Type</option>
      <option value="Altar">Altar</option>
      <option value="Lector">Lector</option>
      <option value="None">None</option>
</select>

<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Login Password</label>
<div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
  <input type="text" name="password" maxLength="8" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} value={form.password || ""} onChange={handleInputChange}/>
  <button type="button" onClick={generateRandomPassword} style={{ padding: '10px 15px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>Generate</button>
</div>

<div className="member-section">
  <h3 style={{ marginBottom: '15px' }}>Family Members</h3>
  <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
    <div style={{ flex: '1', minWidth: '150px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Member Name</label>
      <input type="text" name="name" style={{ flex: '1', width: '100%', padding: '10px', borderRadius: '6px', border: memberErrors.name ? '2px solid red' : '1px solid #ddd' }} value={memberForm.name} onChange={handleMemberInputChange}/>
    </div>
    <div style={{ flex: '1', minWidth: '150px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Relation Type</label>
      <select name="relation" style={{ flex: '1', width: '100%', padding: '10px', borderRadius: '6px', border: memberErrors.relation ? '2px solid red' : '1px solid #ddd' }} value={memberForm.relation} onChange={handleMemberInputChange}>
      <option value="">Select Relation Type</option>
      <option value="Spouse">Spouse</option>
      <option value="Child">Child</option>
      <option value="Parent">Parent</option>
      <option value="Sibling">Sibling</option>
      <option value="Other">Other</option>
    </select>
    </div>
    <div style={{ flex: '1', minWidth: '150px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Community Type</label>
      <select name="community" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: memberErrors.community ? '2px solid red' : '1px solid #ddd' }} value={memberForm.community} onChange={handleMemberInputChange}>
        <option value="">Select Community Type</option>
        <option value="Altar">Altar</option>
        <option value="Lector">Lector</option>
        <option value="None">None</option>
      </select>
    </div>
    <div style={{ flex: '1', minWidth: '150px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '0.9rem' }}>Birth Date</label>
      <input type="date" name="birthDate" style={{ flex: '1', width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} value={memberForm.birthDate || ''} onChange={handleMemberInputChange}/>
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '10px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer' }}>
        <input type="checkbox" name="deceased" checked={memberForm.deceased || false} onChange={(e) => setMemberForm({...memberForm, deceased: e.target.checked})} style={{ cursor: 'pointer', width: '18px', height: '18px' }}/>
        <span>Deceased</span>
      </label>
    </div>
    <button type="button" className="add-btn" style={{ padding: '10px 20px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: 'auto' }} onClick={addFamilyMember}>Add Member</button>
  </div>

  {memberList.length > 0 && (
    <div className="member-list">
      <h4>Members to add</h4>
      <ul>
        {memberList.map((m, index) => (
          <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '10px', opacity: m.deceased ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <span style={{ textDecoration: m.deceased ? 'line-through' : 'none' }}>{m.name} ({m.relation}) {m.community ? `• ${m.community}` : ""} {m.deceased ? "(Deceased)" : ""}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="edit" onClick={() => editFamilyMember(index)} style={{ padding: '4px 8px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
              <button type="button" className="delete" onClick={() => removeFamilyMember(index)} style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>

<p className="hint" style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>Family head is automatically added as the first member.</p>
<button className="primary-btn" style={{ width: '100%', padding: '12px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }} onClick={handleAddFamily}>{editingFamily ? "Save Changes" : "Add Family"}</button>

</div>

)
)}

{/* COMMUNITIES */}

{activeTab==="Communities" &&(

view==="list" ? (
<div>
<table>

<thead>
<tr>
<th>Name</th>
<th>Description</th>
<th>Head</th>
<th>Actions</th>
</tr>
</thead>

<tbody>

{filteredCommunities.map((c,i)=>(
<tr key={i}>
<td>{c.name}</td>
<td>{c.desc}</td>
<td>{c.head}</td>
<td>
  <button 
    className="action-btn edit-btn" 
    style={{ padding: '6px 12px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
    onClick={() => handleRequestInitiate("Edit", c)}>Request Edit</button>
  <button 
    className="action-btn delete-btn" 
    style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
    onClick={() => handleRequestInitiate("Delete", c)}>Request Delete</button>
</td>
</tr>
))}

</tbody>

</table>

</div>
):(

<div className="comunity-card">

<div className="back-link" onClick={()=>setView("list")}> X </div>

<h2>{editingCommunityIdx !== null ? "Edit Community" : "Request New Community"}</h2>

<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Community Name</label>
<input name="name" placeholder="e.g., Youth Choir" value={form.name || ""} style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', border: errors.name ? '2px solid red' : '1px solid #ddd', width: '100%', boxSizing: 'border-box' }} onChange={handleInputChange}/>
<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Assign Community Head</label>
<select name="head" value={form.head || ""} style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' }} onChange={handleInputChange}>
  <option value="">Select Community Head</option>
  {families.flatMap(f => f.members || []).map((m, idx) => (
    <option key={idx} value={m.name}>{m.name} ({m.relation})</option>
  ))}
</select>
<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
<textarea name="desc" rows="3" placeholder="Briefly describe the community..." value={form.desc || ""} style={{ padding: '10px', marginBottom: '20px', borderRadius: '6px', border: errors.desc ? '2px solid red' : '1px solid #ddd', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }} onChange={handleInputChange}/>

<button className="primary-btn" style={{ width: '100%', padding: '12px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }} onClick={handleSaveCommunity}>{editingCommunityIdx !== null ? "Save Changes" : "Add Community"}</button>
{editingCommunityIdx !== null && <button className="primary-btn" style={{ width: '100%', marginTop: '10px', backgroundColor: '#ddd', color: '#333' }} onClick={() => {setView("list"); setEditingCommunityIdx(null); setForm({});}}>Cancel</button>}

</div>

)
)}

{/* DONATION OPTIONS */}

{activeTab==="Donation Options" &&(

view==="list" ? (
<div>
<table>

<thead>
<tr>
<th>Name</th>
<th>Description</th>
<th>Actions</th>
</tr>
</thead>

<tbody>

{filteredDonationOptions.map((d,i)=>(
<tr key={i}>
<td>{d.name}</td>
<td>{d.desc}</td>
<td>
  <button 
    className="action-btn edit-btn" 
    style={{ padding: '6px 12px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }} 
    onClick={() => handleEditDonationOption(d.name)}>Edit</button>
  <button 
    className="action-btn delete-btn" 
    style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
    onClick={() => handleDeleteDonationOption(d.name)}>Delete</button>
</td>
</tr>
))}

</tbody>

</table>

</div>
):(

<div className="donation-card">

<div className="back-link" onClick={()=>setView("list")}> X </div>

<h2>{editingDonationIdx !== null ? "Edit Donation Option" : "Add Donation Option"}</h2>

<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Fund Name</label>
<input name="name" placeholder="e.g., Building Fund" value={form.name || ""} style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', border: errors.name ? '2px solid red' : '1px solid #ddd', width: '100%', boxSizing: 'border-box' }} onChange={handleInputChange}/>
<label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
<textarea name="desc" rows="3" placeholder="What is this fund for?" value={form.desc || ""} style={{ padding: '10px', marginBottom: '20px', borderRadius: '6px', border: errors.desc ? '2px solid red' : '1px solid #ddd', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }} onChange={handleInputChange}/>

<button className="primary-btn" style={{ width: '100%', padding: '12px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }} onClick={handleSaveDonationOption}>{editingDonationIdx !== null ? "Save Changes" : "Add Option"}</button>
{editingDonationIdx !== null && <button className="primary-btn" style={{ width: '100%', marginTop: '10px', backgroundColor: '#ddd', color: '#333' }} onClick={() => {setView("list"); setEditingDonationIdx(null); setForm({});}}>Cancel</button>}

</div>

)
)}

{/* MASS BOOKINGS */}

{activeTab==="Mass Bookings" &&(

<div className="mass-bookings-list-container">
  <div className="table-scroll-container" style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #eceefb', borderRadius: '18px' }}>
  <table>

<thead>
<tr>
<th>Name</th>
<th>Contact</th>
<th>Address</th>
<th>Intentions</th>
<th>Date</th>
<th>Time</th>
<th>Status</th>
</tr>
</thead>

<tbody>

{filteredMassBookings.map((b,i)=>(
<tr key={i}>
<td>{b.name}</td>
<td>{b.phone}</td>
<td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.address}</td>
<td>{b.intentions}</td>
<td>{b.date}</td>
<td>{b.time}</td>
<td>{b.status}</td>
</tr>
))}

  </tbody>

  </table>
  </div>
</div>
)}

{/* DONATIONS */}

{activeTab==="Donations Received" &&(

<div className="donations-list-container">
  <div className="table-scroll-container" style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #eceefb', borderRadius: '18px' }}>
  <table>

<thead>
<tr>
<th>Donor</th>
<th>Contact</th>
<th>Address</th>
<th>Fund</th>
<th>Amount</th>
<th>Date</th>
<th>Status</th>
</tr>
</thead>

<tbody>

{filteredDonations.map((d,i)=>(
<tr key={i}>
<td>{d.donorName}</td>
<td>{d.donorPhone}</td>
<td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.donorAddress}</td>
<td>{d.target}</td>
<td>₹ {d.amount}</td>
<td>{d.date}</td>
<td><span className={`status ${d.status?.toLowerCase()}`}>{d.status}</span></td>
</tr>
))}

</tbody>

</table>
</div>
</div>

)}

{/* HOME MANAGEMENT */}
{activeTab === "Home Management" && (
  <div className="home-mgmt-container">
    <div className="records-card" style={{marginBottom: '30px'}}>
      <h3>Manage Announcements</h3>
      <p className="sub">Remove old or incorrect announcements from the main home screen.</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Title</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {announcements.map(a => (
            <tr key={a._id}>
              <td>{new Date(a.date).toLocaleDateString()}</td>
              <td><span className="status" style={{ background: '#e0e4ff', color: '#4e54c8' }}>{a.category || "General"}</span></td>
              <td>{a.title}</td>
              <td>
                <button 
                  className="action-btn delete-btn" 
                  style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => handleDeleteAnnouncement(a._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="records-card">
      <h3>Mass Schedule Control</h3>
      <div style={{display: 'flex', gap: '15px', marginBottom: '20px', background: '#f9f9f9', padding: '15px', borderRadius: '8px'}}>
        <select name="day" value={form.day || ""} onChange={handleInputChange} style={{flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}>
          <option value="">Select Day</option>
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="time" name="time" value={form.time || ""} onChange={handleInputChange} style={{flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}} />
        <button className="primary-btn" onClick={handleSaveMassTiming}>{massEditId ? "Update" : "Add Timing"}</button>
        {massEditId && <button onClick={() => {setMassEditId(null); setForm({});}}>Cancel</button>}
      </div>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {massTimings.map(m => (
            <tr key={m._id}>
              <td>{m.day}</td>
              <td>{m.time}</td>
              <td>
                <button 
                  className="action-btn edit-btn" 
                  style={{ padding: '6px 12px', backgroundColor: '#6c4ab6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
                  onClick={() => {setMassEditId(m._id); setForm({day: m.day, time: m.time});}}
                >Edit</button>
                <button 
                  className="action-btn delete-btn" 
                  style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => handleDeleteMassTiming(m._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="records-card" style={{marginTop: '30px'}}>
      <h3>Block Dates for Bookings</h3>
      <p className="sub">Manually set dates as "Unavailable" for Mass Bookings (e.g., Public Holidays or Special Events).</p>
      <div style={{display: 'flex', gap: '15px', marginBottom: '20px', background: '#f9f9f9', padding: '15px', borderRadius: '8px'}}>
        <input 
          type="date" 
          name="blockDate" 
          value={form.blockDate || ""} 
          onChange={(e) => {
            handleInputChange(e);
            setForm(prev => ({ ...prev, blockTime: "All Day" }));
          }} 
          min={new Date().toISOString().split("T")[0]} 
          style={{flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}} 
        />
        <select name="blockTime" value={form.blockTime || "All Day"} onChange={handleInputChange} style={{flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}>
          <option value="All Day">All Day</option>
          {form.blockDate && (
            (new Date(form.blockDate + "T00:00:00").getDay() === 0 
              ? ["6:30 AM", "8:00 AM", "10:00 AM"] 
              : new Date(form.blockDate + "T00:00:00").getDay() === 6 
                ? ["6:30 AM", "5:30 PM"] 
                : ["6:30 AM"]
            ).map(t => <option key={t} value={t}>{t}</option>)
          )}
        </select>
        <button className="primary-btn" style={{backgroundColor: '#f44336'}} onClick={handleBlockDate}>Set as Unavailable</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Blocked Date</th>
            <th>Time Slot</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {unavailableDates.map(d => (
            <tr key={d._id}>
              <td>{new Date(d.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              <td><span className="status" style={{ background: '#f0f0f0', color: '#666' }}>{d.time || "All Day"}</span></td>
              <td>
                <button 
                  className="action-btn delete-btn" 
                  style={{ padding: '6px 12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => handleUnblockDate(d._id)}>Make Available</button>
              </td>
            </tr>
          ))}
          {unavailableDates.length === 0 && (
            <tr>
              <td colSpan="2" style={{textAlign: 'center', color: '#999'}}>No dates currently blocked.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

{/* PARISH GALLERY */}
{activeTab === "Parish Gallery" && (
  <div className="records-card">
    <h3>Manage Parish Gallery</h3>
    <div style={{ marginBottom: '20px', border: '2px dashed #ddd', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
      <input type="file" accept="image/*" onChange={handleImageChange} id="fileInputAdmin" style={{ display: 'none' }} />
      <label htmlFor="fileInputAdmin" style={{ cursor: 'pointer', color: '#6c4ab6', fontWeight: 'bold' }}>
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

</div> {/* Closes tab-content */}

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
export default AdminDashboard;