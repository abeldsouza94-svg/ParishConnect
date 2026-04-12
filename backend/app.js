const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database (replace with MongoDB in production)
const db = {
  families: [],
  members: [],
  communities: [
    { _id: '1', name: 'Altar Servers', desc: 'Community of altar servers', head: '' },
    { _id: '2', name: 'Lectors', desc: 'Community of lectors', head: '' }
  ],
  records: [],
  sacraments: [],
  donations: [],
  donationOptions: [
    { _id: '1', name: 'To the Church', desc: 'General maintenance and operations.' },
    { _id: '2', name: 'To Pilar Church', desc: 'Support for sister parish missions.' },
    { _id: '3', name: 'Good Samaritan Fund', desc: 'Assistance for the needy in our community.' }
  ],
  massBookings: [],
  gallery: [],
  altarAssignments: [],
  lectorAssignments: []
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ParishConnect API is running' });
});

// Families endpoints
app.get('/families', (req, res) => {
  res.json(db.families);
});

app.post('/families', (req, res) => {
  const family = { _id: Date.now().toString(), ...req.body };
  db.families.push(family);
  res.json(family);
});

app.put('/families/:id', (req, res) => {
  const idx = db.families.findIndex(f => f._id === req.params.id);
  if (idx !== -1) {
    db.families[idx] = { ...db.families[idx], ...req.body };
    res.json(db.families[idx]);
  } else {
    res.status(404).json({ error: 'Family not found' });
  }
});

app.delete('/families/:id', (req, res) => {
  db.families = db.families.filter(f => f._id !== req.params.id);
  res.json({ success: true });
});

// Records/Sacraments endpoints
app.get('/records', (req, res) => {
  res.json(db.records);
});

app.post('/records', (req, res) => {
  const record = { _id: Date.now().toString(), ...req.body };
  db.records.push(record);
  res.json(record);
});

app.put('/records/:id', (req, res) => {
  const idx = db.records.findIndex(r => r._id === req.params.id);
  if (idx !== -1) {
    db.records[idx] = { ...db.records[idx], ...req.body };
    res.json(db.records[idx]);
  } else {
    res.status(404).json({ error: 'Record not found' });
  }
});

app.delete('/records/:id', (req, res) => {
  db.records = db.records.filter(r => r._id !== req.params.id);
  res.json({ success: true });
});

// Communities endpoints
app.get('/communities', (req, res) => {
  res.json(db.communities);
});

app.post('/communities', (req, res) => {
  const community = { _id: Date.now().toString(), ...req.body };
  db.communities.push(community);
  res.json(community);
});

app.put('/communities/:id', (req, res) => {
  const idx = db.communities.findIndex(c => c._id === req.params.id);
  if (idx !== -1) {
    db.communities[idx] = { ...db.communities[idx], ...req.body };
    res.json(db.communities[idx]);
  } else {
    res.status(404).json({ error: 'Community not found' });
  }
});

// Donation Options endpoints
app.get('/donation-options', (req, res) => {
  res.json(db.donationOptions);
});

app.post('/donation-options', (req, res) => {
  const option = { _id: Date.now().toString(), ...req.body };
  db.donationOptions.push(option);
  res.json(option);
});

// Donations endpoints
app.get('/donations', (req, res) => {
  res.json(db.donations);
});

app.post('/donations', (req, res) => {
  const donation = { _id: Date.now().toString(), ...req.body };
  db.donations.push(donation);
  res.json(donation);
});

// Mass Bookings endpoints
app.get('/mass-bookings', (req, res) => {
  res.json(db.massBookings);
});

app.post('/mass-bookings', (req, res) => {
  const booking = { _id: Date.now().toString(), ...req.body };
  db.massBookings.push(booking);
  res.json(booking);
});

app.delete('/mass-bookings/:id', (req, res) => {
  db.massBookings = db.massBookings.filter(b => b._id !== req.params.id);
  res.json({ success: true });
});

// Gallery endpoints
app.get('/gallery', (req, res) => {
  res.json(db.gallery);
});

app.post('/gallery', (req, res) => {
  const item = { _id: Date.now().toString(), ...req.body };
  db.gallery.push(item);
  res.json(item);
});

app.delete('/gallery/:id', (req, res) => {
  db.gallery = db.gallery.filter(g => g._id !== req.params.id);
  res.json({ success: true });
});

// Altar Assignments endpoints
app.get('/altar-assignments', (req, res) => {
  res.json(db.altarAssignments);
});

app.post('/altar-assignments', (req, res) => {
  const assignment = { _id: Date.now().toString(), ...req.body };
  db.altarAssignments.push(assignment);
  res.json(assignment);
});

app.delete('/altar-assignments/:id', (req, res) => {
  db.altarAssignments = db.altarAssignments.filter(a => a._id !== req.params.id);
  res.json({ success: true });
});

// Lector Assignments endpoints
app.get('/lector-assignments', (req, res) => {
  res.json(db.lectorAssignments);
});

app.post('/lector-assignments', (req, res) => {
  const assignment = { _id: Date.now().toString(), ...req.body };
  db.lectorAssignments.push(assignment);
  res.json(assignment);
});

app.delete('/lector-assignments/:id', (req, res) => {
  db.lectorAssignments = db.lectorAssignments.filter(a => a._id !== req.params.id);
  res.json({ success: true });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`ParishConnect API listening on http://localhost:${PORT}`);
});

module.exports = app;
