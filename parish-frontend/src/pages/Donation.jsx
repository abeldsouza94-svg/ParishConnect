import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import "./Donation.css";

function Donation() {
  const [amount, setAmount] = useState(500);
  const [target, setTarget] = useState("To the Church");
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [error, setError] = useState("");

  const handleAmountChange = (value) => {
    // Ensure value is a number before setting
    const num = Number(value);
    setAmount(num);

    if (num < 100) {
      setError("Minimum donation amount is ₹100");
    } 
    else if (num > 100000) {
      setError("Maximum donation amount is ₹1,00,000");
    } 
    else {
      setError("");
    }
  };

  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const showNotify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePayment = () => {

    if (!donorName || !donorPhone || !donorAddress) {
      setError("Please fill in your contact details before proceeding.");
      return;
    }

    if (amount < 100 || amount > 100000) {
      setError("Please enter an amount between ₹100 and ₹1,00,000");
      return;
    }

    const options = {
      key: "rzp_test_SRSusjYraQKAww",
      amount: amount * 100,
      currency: "INR",
      name: "ParishConnect",
      description: `Donation - ${target}`,

      handler: async function (response) {
        const donationData = {
          amount: amount,
          target: target,
          donorName: donorName,
          donorPhone: donorPhone,
          donorAddress: donorAddress,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
          date: new Date().toISOString().slice(0, 10),
          status: "Completed", 
        };
        try {
          // Send donation data to your backend
          const res = await fetch("http://localhost:5000/donations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(donationData),
          });
          if (!res.ok) throw new Error("Failed to save donation");

          showNotify("Payment Successful!", "success");
          navigate("/"); // Redirect to homepage
        } catch (error) {
          console.error("Error saving donation:", error);
          showNotify("Donation Failed!", "error");
        }
      },

      theme: {
        color: "#6c4ab6"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="donation-page">

      <div className="backbutton">
        <BackButton />
      </div>
      

      <div className="donation-card2">

        <h4>SUPPORT OUR MISSION</h4>
        <h2>Make a Donation</h2>

        <div className="donor-info-section" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Full Name</label>
          <input 
            type="text" placeholder="Your Name" value={donorName} 
            onChange={(e) => setDonorName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }} 
          />
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Phone Number</label>
          <input 
            type="text" placeholder="Mobile No." value={donorPhone} 
            onChange={(e) => setDonorPhone(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }} 
          />
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Address</label>
          <textarea 
            placeholder="Your Address" value={donorAddress} 
            onChange={(e) => setDonorAddress(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '60px' }} 
          />
        </div>

        <div className="targets">

          <div onClick={() => setTarget("To the Church")} className="option">
            <input type="radio" checked={target==="To the Church"} readOnly />
            <div>
              <strong>To the Church</strong>
              <p>General maintenance.</p>
            </div>
          </div>

          <div onClick={() => setTarget("To Pilar Church")} className="option">
            <input type="radio" checked={target==="To Pilar Church"} readOnly />
            <div>
              <strong>To Pilar Church</strong>
              <p>Sister parish mission.</p>
            </div>
          </div>

          <div onClick={() => setTarget("Good Samaritan Fund")} className="option">
            <input type="radio" checked={target==="Good Samaritan Fund"} readOnly />
            <div>
              <strong>Good Samaritan Fund</strong>
              <p>Assistance for the needy.</p>
            </div>
          </div>

        </div>

        <h4>Select Amount (₹)</h4>

        <div className="amounts">
          {[500,1000,2000,5000].map((amt)=>(
            <button
              key={amt}
              className={amount===amt?"active":""}
              onClick={()=>handleAmountChange(amt)}
            >
              ₹ {amt}
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}

        <div className="custom-amount">
          <label>Enter Custom Amount (₹)</label>

          <input
            type="number"
            min="100"
            max="100000"
            placeholder="₹100 - ₹100000"
            value={amount}
            onChange={(e)=>handleAmountChange(e.target.value)}
          />

          {/* Error message */}
          {error && (
            <p className="amount-error">
              {error}
            </p>
          )}
        </div>

        <button className="pay-btn" onClick={handlePayment}>
          Donate ₹ {amount} to {target}
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
}

export default Donation;