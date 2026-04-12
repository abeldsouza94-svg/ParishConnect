// ===== IMPORTS =====
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const nodemailer = require("nodemailer");
const { Server } = require("socket.io");

// ===== APP SETUP =====
const app = express();
app.use(cors({
  origin: ["https://parish-connect-ten.vercel.app", "http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
// Increase limit for Base64 image uploads
app.use(express.json({ limit: '10mb' }));

const uri="mongodb://church_db:church_db@ac-gv6yjei-shard-00-00.1n2sw2k.mongodb.net:27017,ac-gv6yjei-shard-00-01.1n2sw2k.mongodb.net:27017,ac-gv6yjei-shard-00-02.1n2sw2k.mongodb.net:27017/?ssl=true&replicaSet=atlas-11v5l2-shard-0&authSource=admin&appName=Cluster0";
// CONNECT MONGODB
mongoose.connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// SCHEMA
const MessageSchema = new mongoose.Schema({
  id: Number,
  community: String,
  user: Object,
  text: String,
  time: Number,
});

const Message = mongoose.model("Message", MessageSchema);

const ParishRecordSchema = new mongoose.Schema({
  type: { type: String, required: true },
  name: { type: String, required: true },
  familyId: { type: String, default: "" },
  date: { type: String, required: true },
  godfather: { type: String, default: "" },
  godmother: { type: String, default: "" },
}, {
  timestamps: true,
});

const ParishRecord = mongoose.model("ParishRecord", ParishRecordSchema);

const FamilySchema = new mongoose.Schema({
  familyId: { type: String, required: true, unique: true },
  head: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, default: "familypass" },
  members: [{
    name: String,
    relation: String,
    community: String,
    birthDate: { type: String, default: "" },
    deathDate: { type: String, default: "" },
    deceased: { type: Boolean, default: false }
  }]
}, {
  timestamps: true,
});

const Family = mongoose.model("Family", FamilySchema);

// MIGRATION: Ensure all existing families have a password field
Family.updateMany(
  { password: { $exists: false } },
  { $set: { password: "familypass" } }
).then(res => {
  if (res.modifiedCount > 0) console.log(`Migrated ${res.modifiedCount} families with default password.`);
});

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, default: "General" },
  date: { type: String, required: true },
}, { timestamps: true });

const Announcement = mongoose.model("Announcement", AnnouncementSchema);

const MassTimingSchema = new mongoose.Schema({
  day: { type: String, required: true },
  time: { type: String, required: true },
});

const MassTiming = mongoose.model("MassTiming", MassTimingSchema);

const DonationSchema = new mongoose.Schema({
  amount: Number,
  target: String,
  donorName: String,
  donorPhone: String,
  donorAddress: String,
  paymentId: String,
  orderId: String,
  date: String,
  status: { type: String, default: "Pending" }
}, { timestamps: true });

const Donation = mongoose.model("Donation", DonationSchema);

const MassBookingSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  intentions: String,
  date: String,
  time: String,
  status: { type: String, default: "Pending" },
  paidAmount: Number,
  paymentId: String,
  orderId: String,
  signature: String,
}, { timestamps: true });

const MassBooking = mongoose.model("MassBooking", MassBookingSchema);

const UnavailableDateSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, default: "All Day" }
});

const UnavailableDate = mongoose.model("UnavailableDate", UnavailableDateSchema);

const AltarAssignmentSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  servers: [{ type: String }],
}, { timestamps: true });

const AltarAssignment = mongoose.model("AltarAssignment", AltarAssignmentSchema);

const LectorAssignmentSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  readings: [{ type: Object }], // Stores { type, person, custom }
}, { timestamps: true });

const LectorAssignment = mongoose.model("LectorAssignment", LectorAssignmentSchema);

const GalleryItemSchema = new mongoose.Schema({
  image: { type: String, required: true }, // Base64 Data
  caption: { type: String, default: "" },
  date: { type: String, required: true },
}, { timestamps: true });

const GalleryItem = mongoose.model("GalleryItem", GalleryItemSchema);

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  head: { type: String, default: "" }, // Head member name
  headFamily: { type: String, default: "" }, // Family ID of the head
  requestStatus: { type: String, enum: ["active", "pending"], default: "active" },
  requestDate: { type: String, default: "" },
}, { timestamps: true });

const Community = mongoose.model("Community", CommunitySchema);

// SMS HELPER (Fast2SMS)
const sendSMS = async (numbers, message) => {
  if (!numbers) return;
  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": "dkxRBi5VEam49qSFhYM60zsZGANT7cpnotDfjwrg2lLQb1yvHKIWr2lVpUkXMx9qGCn0Qgt53K16PJmY",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        route: "q",
        message: message,
        numbers: numbers
      })
    });
    const data = await response.json();
    if (!data.return) {
      console.error("Fast2SMS Rejection:", data.message);
    }
    return data;
  } catch (err) { console.error("Fast2SMS API Error:", err); }
};

// ROUTES
app.get("/messages/:community", async (req, res) => {
  const msgs = await Message.find({
    community: req.params.community,
  }).sort({ time: 1 });

  res.json(msgs);
});

app.delete("/messages/:community", async (req, res) => {
  try {
    await Message.deleteMany({ community: req.params.community });
    res.json({ message: "Chat cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear chat" });
  }
});

app.get("/records", async (req, res) => {
  try {
    const records = await ParishRecord.find().sort({ date: 1 });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to fetch parish records" });
  }
});

app.post("/records", async (req, res) => {
  try {
    const record = new ParishRecord(req.body);
    const saved = await record.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to save parish record" });
  }
});

app.get("/families", async (req, res) => {
  try {
    const families = await Family.find().sort({ createdAt: 1 });
    res.json(families);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to fetch families" });
  }
});

app.post("/families", async (req, res) => {
  try {
    const family = new Family(req.body);
    const saved = await family.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to save family" });
  }
});

app.post("/families/login", async (req, res) => {
  const { familyId, password } = req.body;
  try {
    const family = await Family.findOne({ familyId, password });
    if (family) {
      res.json(family);
    } else {
      res.status(401).json({ error: "Invalid Family ID or Password" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
});

app.put("/families/:id", async (req, res) => {
  try {
    const updated = await Family.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to update family" });
  }
});

app.delete("/families/:id", async (req, res) => {
  try {
    await Family.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to delete family" });
  }
});

// QUICK SMS ROUTE
app.post("/send-sms", async (req, res) => {
  const { phone, message } = req.body;
  try {
    const result = await sendSMS(phone, message);
    if (result && result.return) {
      res.json({ success: true, result });
    } else {
      res.status(400).json({ error: result?.message || "Fast2SMS failed to accept the request" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

// ANNOUNCEMENT ROUTES
app.get("/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

app.post("/announcements", async (req, res) => {
  try {
    const newAnnouncement = new Announcement(req.body);
    const saved = await newAnnouncement.save();

    // Send SMS in background so it doesn't block the response
    (async () => {
      if (req.body.category === "Altar Servers" || req.body.category === "Lectors Ministry") {
        const commType = req.body.category === "Altar Servers" ? "Altar" : "Lector";
        const targetFamilies = await Family.find({ "members.community": commType });
        const phones = [...new Set(targetFamilies.map(f => f.phone))].join(",");
        if (phones) {
          await sendSMS(phones, `Parish Notice (${req.body.category}): ${req.body.title}. ${req.body.message}`);
        }
      }
    })();

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to post announcement" });
  }
});

app.delete("/announcements/:id", async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// MASS TIMING ROUTES
app.get("/mass-timings", async (req, res) => {
  try {
    const timings = await MassTiming.find();
    res.json(timings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch timings" });
  }
});

app.post("/mass-timings", async (req, res) => {
  try {
    const newTiming = new MassTiming(req.body);
    const saved = await newTiming.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to save timing" });
  }
});

app.delete("/mass-timings/:id", async (req, res) => {
  try {
    await MassTiming.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// MASS BOOKING ROUTES
app.get("/mass-bookings", async (req, res) => {
  try {
    const bookings = await MassBooking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

app.post("/mass-bookings", async (req, res) => {
  try {
    const booking = new MassBooking(req.body);
    const saved = await booking.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to save booking" });
  }
});

// UNAVAILABLE DATES ROUTES
app.get("/unavailable-dates", async (req, res) => {
  try {
    const dates = await UnavailableDate.find();
    res.json(dates);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blocked dates" });
  }
});

app.post("/unavailable-dates", async (req, res) => {
  try {
    const newDate = new UnavailableDate(req.body);
    await newDate.save();
    res.status(201).json(newDate);
  } catch (err) {
    res.status(500).json({ error: "Failed to block date" });
  }
});

app.delete("/unavailable-dates/:id", async (req, res) => {
  try {
    await UnavailableDate.findByIdAndDelete(req.params.id);
    res.json({ message: "Date unblocked" });
  } catch (err) {
    res.status(500).json({ error: "Failed to unblock date" });
  }
});

// ALTAR ASSIGNMENT ROUTES
app.get("/altar-assignments", async (req, res) => {
  try {
    const assignments = await AltarAssignment.find().sort({ date: 1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

app.post("/altar-assignments", async (req, res) => {
  try {
    const newAssignment = new AltarAssignment(req.body);
    const saved = await newAssignment.save();

    // Background SMS
    (async () => {
      const families = await Family.find({ "members.name": { $in: req.body.servers } });
      const phones = [...new Set(families.map(f => f.phone))].join(",");
      if (phones) {
        await sendSMS(phones, `Assignment Alert: You have been assigned for Altar Server duty on ${req.body.date} at ${req.body.time}.`);
      }
    })();

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to save assignment" });
  }
});

app.put("/altar-assignments/:id", async (req, res) => {
  try {
    const updated = await AltarAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    (async () => {
      const families = await Family.find({ "members.name": { $in: req.body.servers } });
      const phones = [...new Set(families.map(f => f.phone))].join(",");
      if (phones) {
        await sendSMS(phones, `Assignment Updated: Your Altar Server duty has been updated to ${req.body.date} at ${req.body.time}.`);
      }
    })();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

app.delete("/altar-assignments/:id", async (req, res) => {
  try {
    await AltarAssignment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

// LECTOR ASSIGNMENT ROUTES
app.get("/lector-assignments", async (req, res) => {
  try {
    const assignments = await LectorAssignment.find().sort({ date: 1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lector assignments" });
  }
});

app.post("/lector-assignments", async (req, res) => {
  try {
    const newAssignment = new LectorAssignment(req.body);
    const saved = await newAssignment.save();

    // Background SMS
    (async () => {
      const lectorNames = req.body.readings.map(r => r.person).filter(p => p);
      const families = await Family.find({ "members.name": { $in: lectorNames } });
      const phones = [...new Set(families.map(f => f.phone))].join(",");
      if (phones) {
        await sendSMS(phones, `Lector Alert: You have been assigned for Mass Readings on ${req.body.date} at ${req.body.time}. Please check your portal.`);
      }
    })();

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to save lector assignment" });
  }
});

app.put("/lector-assignments/:id", async (req, res) => {
  try {
    const updated = await LectorAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true });

    (async () => {
      const lectorNames = req.body.readings.map(r => r.person).filter(p => p);
      const families = await Family.find({ "members.name": { $in: lectorNames } });
      const phones = [...new Set(families.map(f => f.phone))].join(",");
      if (phones) {
        await sendSMS(phones, `Lector Update: Your reading assignment for ${req.body.date} has been updated. Please check the portal.`);
      }
    })();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update lector assignment" });
  }
});

app.delete("/lector-assignments/:id", async (req, res) => {
  try {
    await LectorAssignment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete lector assignment" });
  }
});

// GALLERY ROUTES
app.get("/gallery", async (req, res) => {
  try {
    const items = await GalleryItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch gallery" });
  }
});

app.post("/gallery", async (req, res) => {
  try {
    const newItem = new GalleryItem(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

app.delete("/gallery/:id", async (req, res) => {
  try {
    await GalleryItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Photo deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

// DONATION ROUTES
app.get("/donations", async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch donations" });
  }
});

app.post("/donations", async (req, res) => {
  try {
    const donation = new Donation(req.body);
    const saved = await donation.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to record donation" });
  }
});

// COMMUNITY ROUTES
app.get("/communities", async (req, res) => {
  try {
    const communities = await Community.find().sort({ createdAt: 1 });
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch communities" });
  }
});

app.post("/communities", async (req, res) => {
  try {
    const community = new Community(req.body);
    const saved = await community.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to create community" });
  }
});

app.put("/communities/:id", async (req, res) => {
  try {
    const updated = await Community.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update community" });
  }
});

app.delete("/communities/:id", async (req, res) => {
  try {
    await Community.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete community" });
  }
});

// Update family member as community head
app.put("/communities/:id/set-head", async (req, res) => {
  try {
    const { memberId, memberName, familyId } = req.body;
    const updated = await Community.findByIdAndUpdate(
      req.params.id,
      { head: memberName, headFamily: familyId },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to set community head" });
  }
});

// RAZORPAY WEBHOOK
app.post("/razorpay-webhook", async (req, res) => {
  const event = req.body.event;
  const payment = req.body.payload.payment.entity;

  // In a real app, you should verify the X-Razorpay-Signature header here
  if (event === "payment.captured") {
    await Donation.findOneAndUpdate({ paymentId: payment.id }, { status: "Completed" });
  } else if (event === "payment.failed") {
    await Donation.findOneAndUpdate({ paymentId: payment.id }, { status: "Failed" });
  }

  res.json({ status: "ok" });
});

// CONFIGURE EMAIL TRANSPORTER
// IMPORTANT: Use an "App Password" from Google, NOT your regular Gmail password.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dummyproject.1968s@gmail.com",
    pass: "jpyghbzfemjchmme" 
  }
});

// EMAIL REQUEST ROUTE
app.post("/send-request", async (req, res) => {
  try {
    const { subject, body } = req.body;

    const mailOptions = {
      from: "dummyproject.1968s@gmail.com",
      to: "abeldsouza12@gmail.com",
      subject: subject,
      text: body
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`Real Email sent to abeldsouza12@gmail.com`);
    res.status(200).json({ message: "Request received by the server." });
  } catch (err) {
    console.error("Mail Error:", err);
    res.status(500).json({ error: "Failed to process request." });
  }
});

// ===== SOCKET.IO SETUP =====
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://parish-connect-ten.vercel.app", "http://localhost:5173", "http://localhost:3000"],
    credentials: true
  },
});

// ===== SOCKET EVENTS =====
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("sendMessage", async (data) => {
    try {
      const msg = new Message(data);
      await msg.save();

      io.emit("receiveMessage", data);
    } catch (err) {
      console.log("Error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// ===== START SERVER =====
server.listen(5000, () => {
  console.log("Server running on port 5000");
});