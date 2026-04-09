import React, { useState } from "react";
import "./MassBooking.css";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

const API_BASE = "http://localhost:5000";

const MassBooking = () => {

  const navigate = useNavigate();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [names, setNames] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [intentions, setIntentions] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isDayFull, setIsDayFull] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);


  const handleDateChange = async (selectedDate) => {
    setDate(selectedDate);
    setTime("");
    setIsDayFull(false);

    let bookingsOnDay = [];
    let blockedSlots = [];

    try {
      // Fetch existing bookings for this date
      const res = await fetch(`${API_BASE}/mass-bookings`);
      if (res.ok) {
        const data = await res.json();
        bookingsOnDay = data.filter(b => b.date === selectedDate);
      }

      // Check if Admin has manually blocked this date
      const blockRes = await fetch(`${API_BASE}/unavailable-dates`);
      if (blockRes.ok) {
        const blockedDates = await blockRes.json();
        const dailyBlocks = blockedDates.filter(d => d.date === selectedDate);
        if (dailyBlocks.some(d => d.time === "All Day")) {
          setIsDayFull(true);
          setAvailableTimes([]);
          return;
        }
        blockedSlots = dailyBlocks.map(d => d.time);
      }
    } catch (err) {
      console.error("Error checking availability:", err);
    }

    // Logic for Mass Timings:
    // Every day: 6:30 AM
    // Saturday: 6:30 AM, 5:30 PM (1 extra)
    // Sunday: 6:30 AM, 8:00 AM, 10:00 AM (2 extras)
    const day = new Date(selectedDate + "T00:00:00").getDay();
    let times = ["6:30 AM"];

    if (day === 0) { // Sunday
      times = ["6:30 AM", "8:00 AM", "10:00 AM"];
    } else if (day === 6) { // Saturday
      times = ["6:30 AM", "5:30 PM"];
    }

    // Map times to objects showing if they are full
    const mappedTimes = times.map(t => {
      const isSlotTaken = bookingsOnDay.some(b => b.time === t);
      const isSlotBlocked = blockedSlots.includes(t);
      return {
        time: t,
        full: isSlotBlocked || isSlotTaken
      };
    });

    setAvailableTimes(mappedTimes);
    // Only mark the whole day full if every available slot is taken or admin blocked it
    setIsDayFull(mappedTimes.every(t => t.full));
  };

  const showNotify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };


  const validate = () => {

    let newErrors = {};

    if (!date) newErrors.date = "Please select a date";
    if (!time) newErrors.time = "Please select a mass time";
    if (!names) newErrors.names = "Please enter names";
    if (!phone) newErrors.phone = "Please enter phone number";
    if (!address) newErrors.address = "Please enter address";
    if (!intentions) newErrors.intentions = "Please enter intentions";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };


  const handleSubmit = () => {

    if (!validate()) return;

    const razorpayOptions = {
      key: "rzp_test_SRSusjYraQKAww", // Replace with your actual Razorpay Key ID
      amount: 100 * 100, // Amount in paise (e.g., 100 = ₹1)
      currency: "INR",
      name: "ParishConnect",
      description: "Mass Offering",
      handler: async function (response) {
        const bookingData = {
          name: names,
          phone: phone,
          address: address,
          intentions: intentions,
          date: date,
          time: time,
          status: "Confirmed", // Status from Razorpay
          paidAmount: 100,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        };

        try {
          // Send booking data to your backend
          await fetch(`${API_BASE}/mass-bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingData),
          });
          showNotify("Mass Booking Successful!", "success");
          navigate("/"); // Redirect to homepage
        } catch (error) {
          console.error("Error saving mass booking:", error);
          showNotify("Mass Booking Failed!", "error");
        }
      },
      theme: {
        color: "#6c4ab6"
      }
    };

    const rzp = new window.Razorpay(razorpayOptions);
    rzp.open();

  };


  return (
    
    <div className="mass-container">

      <div className="backbutton">
        <BackButton />
      </div>

      <div className="mass-card">

        <p className="mass-label">
          MASS INTENTIONS
        </p>

        <h2>Book a Mass</h2>


        <div className="row">

          <div className="field">

            <label>Preferred Date</label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                handleDateChange(e.target.value)
              }
              min={new Date().toISOString().split("T")[0]}
            />

            {errors.date && (
              <p className="error">{errors.date}</p>
            )}

          </div>


          <div className="field">

            <label>Available Time {isDayFull && <span style={{color: 'red'}}> (Fully Booked)</span>}</label>

            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={isDayFull}
            >

              <option value="">
                Select mass time
              </option>

              {availableTimes.map((t, index) => (
                <option key={index} value={t.time} disabled={t.full}>
                  {t.time} {t.full ? "(Full)" : ""}
                </option>
              ))}

            </select>

            {errors.time && (
              <p className="error">{errors.time}</p>
            )}

          </div>

        </div>


        <div className="field">

          <label>Intention For (Names)</label>

          <input
            type="text"
            placeholder="e.g., John and Maria D'sa"
            value={names}
            onChange={(e) => setNames(e.target.value)}
          />

          {errors.names && (
            <p className="error">{errors.names}</p>
          )}

        </div>

        <div className="row">
          <div className="field">
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="Mobile No."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {errors.phone && (
              <p className="error">{errors.phone}</p>
            )}
          </div>
        </div>

        <div className="field">
          <label>Address</label>
          <textarea
            rows="2"
            placeholder="Your Residential Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {errors.address && (
            <p className="error">{errors.address}</p>
          )}
        </div>


        <div className="field">

          <label>Type Down Your Intentions</label>

          <textarea
            rows="4"
            placeholder="e.g., In memory of a loved one, Anniversary, Birthday, Health, Thanksgiving..."
            value={intentions}
            onChange={(e) => setIntentions(e.target.value)}
          />

          {errors.intentions && (
            <p className="error">{errors.intentions}</p>
          )}

        </div>


        <div className="total">

          <span>Total Offering</span>
          <strong>₹100</strong>

        </div>


        <button
          className="confirm-btn"
          onClick={handleSubmit}
        >
          Confirm & Pay Offering
        </button>

      </div>

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

export default MassBooking;