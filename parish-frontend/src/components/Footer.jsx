import "./Footer.css";
import { Link } from "react-router-dom";


export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>ParishConnect</h4>
          <p>Strengthening our parish community through digital connection and engagement.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <Link to="/mass-booking">
              <p>Book a Mass</p>
          </Link>

          <Link to="/donate">
              <p>Make a Donation</p>
          </Link>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact</h4>
          <p>Email: parishconnect@gmail.com</p>
          <p>Phone: +91 95118 16205</p>
        </div>

        <div className="footer-section">
          <h4>Office Hours</h4>
          <p>Mon - Fri: 10:00 AM - 5:00 PM</p>
          <p>Sat - Sun: 10:00 AM - 2:00 PM</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} ParishConnect. All rights reserved.</p>
      </div>
    </footer>
  );
}
