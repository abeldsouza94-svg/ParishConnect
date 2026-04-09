import { useState } from "react";
import "./UserManual.css";

export default function UserManual({ isOpen, onClose, section = "general" }) {
  const [activeSection, setActiveSection] = useState(section);

  const sections = {
    general: {
      title: "Getting Started",
      content: (
        <div className="manual-content">
          <h3>Welcome to ParishConnect</h3>
          <p>
            ParishConnect is a comprehensive platform designed to connect our parish community.
            Here's what you can do with our application:
          </p>
          <ul>
            <li><strong>Book a Mass:</strong> Schedule and book a mass for special occasions</li>
            <li><strong>Make Donations:</strong> Support our parish with secure online donations</li>
            <li><strong>View Announcements:</strong> Stay updated with the latest parish news</li>
            <li><strong>Access Family Profiles:</strong> View family member records and details</li>
          </ul>
        </div>
      )
    },
    login: {
      title: "How to Login",
      content: (
        <div className="manual-content">
          <h3>Logging Into ParishConnect</h3>
          <ol>
            <li>Click the "Login" button in the top navigation</li>
            <li>Enter your Family ID or username</li>
            <li>Enter your password</li>
            <li>Click "Login" to access your account</li>
          </ol>
        </div>
      )
    },
    booking: {
      title: "Book a Mass",
      content: (
        <div className="manual-content">
          <h3>How to Book a Mass</h3>
          <ol>
            <li>From the home page, click "Book a Mass"</li>
            <li>Fill in your details (name, phone, address)</li>
            <li>Select your preferred date and time</li>
            <li>Choose the mass type (funeral, wedding, etc.)</li>
            <li>Enter any special requests or notes</li>
            <li>Click "Submit" to book</li>
          </ol>
        </div>
      )
    },
    donation: {
      title: "Make a Donation",
      content: (
        <div className="manual-content">
          <h3>How to Donate</h3>
          <ol>
            <li>Click "Donate" or go to the Donation page</li>
            <li>Select the donation </li>
            <li>Enter the donation amount</li>
            <li>Provide your contact information</li>
            <li>Choose your payment method</li>
            <li>Complete the payment process</li>
          </ol>
          <p><strong>All donations are secure and protected.</strong> We accept multiple payment methods for your convenience.</p>
        </div>
      )
    },
    family: {
      title: "Family Profiles",
      content: (
        <div className="manual-content">
          <h3>Understanding Family Profiles</h3>
          <p>The Family Profiles section displays information about members of your family:</p>
          <ul>
            <li><strong>Click to View:</strong> Click on any family member to view their dashboard</li>
            <li><strong>Edit Profile:</strong> Contact the admin to update family member information</li>
          </ul>
        </div>
      )
    },
  };

  if (!isOpen) return null;

  return (
    <div className="manual-overlay" onClick={onClose}>
      <div className="manual-modal" onClick={(e) => e.stopPropagation()}>
        <div className="manual-header">
          <h2>User Manual</h2>
          <button className="manual-close" onClick={onClose}>×</button>
        </div>

        <div className="manual-container">
          <div className="manual-sidebar">
            {Object.entries(sections).map(([key, section]) => (
              <button
                key={key}
                className={`manual-nav-item ${activeSection === key ? "active" : ""}`}
                onClick={() => setActiveSection(key)}
              >
                {section.title}
              </button>
            ))}
          </div>

          <div className="manual-body">
            {sections[activeSection]?.content}
          </div>
        </div>
      </div>
    </div>
  );
}
