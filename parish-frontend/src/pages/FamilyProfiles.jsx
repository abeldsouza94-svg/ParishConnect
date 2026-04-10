import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FamilyProfiles.css";
import BackButton from "../components/BackButton";
import Footer from "../components/Footer";
import UserManual from "../components/UserManual";
import LoadingOverlay from "../components/LoadingOverlay";
import { API_BASE_URL } from "../config/api";

function FamilyProfiles() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [familyName, setFamilyName] = useState("Loading...");
  const [manualOpen, setManualOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const familyId = localStorage.getItem("familyId");
    if (!familyId) {
      navigate("/login");
      return;
    }

    fetch(`${API_BASE_URL}/families`)
      .then(res => res.json())
      .then(data => {
        const currentFamily = data.find(f => f.familyId === familyId);
        if (currentFamily) {
          setMembers(currentFamily.members || []);
          setFamilyName(`${currentFamily.head}'s Family`);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setFamilyName("Unable to load family");
        setIsLoading(false);
      });
  }, [navigate]);

  const openProfile = (member) => {
    localStorage.setItem("userName", member.name);
    localStorage.setItem("userCommunity", member.community || "None");
    navigate("/member-dashboard");
  };

  const handleSignOut = () => {
    localStorage.removeItem("familyId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userCommunity");
    navigate("/login");
  };

  return (
    <div className="family-page">
      <LoadingOverlay isLoading={isLoading} message="Loading family profiles..." />
      {/* HEADER */}
      <header className="family-header">
        <div className="header-top">
          <BackButton />
          <h1 className="header-title">Family Profiles</h1>
          <button 
            className="btn-help-family"
            onClick={() => setManualOpen(true)}
            title="View user manual"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4m0-4h.01"></path>
            </svg>
          </button>
        </div>
        <p className="family-welcome">Welcome, {familyName}</p>
      </header>

      {/* MAIN CONTENT */}
      <main className="family-content">
        <div className="container">
          <h2>Select Profile to Continue</h2>

          {members.length > 0 ? (
            <div className="profile-list">
              {members.map((member, index) => (
                <div
                  key={index}
                  className="profile-card"
                  onClick={() => openProfile(member)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && openProfile(member)}
                >
                  <div className="profile-content">
                    

                    <div className="profile-info">
                      <h4>{member.name}</h4>
                      <p className="role">{member.role || "Parishioner"}</p>
                      {member.community && <span className="community-tag">{member.community}</span>}
                    </div>
                  </div>

                  <span className="arrow">›</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No family members found. Please contact the administrator.</p>
            </div>
          )}
        </div>
      </main>

      {/* SIGN OUT BUTTON */}
      <div className="family-actions">
        <button 
          className="btn btn-danger"
          onClick={handleSignOut}
        >
          Sign Out Family Account
        </button>
      </div>

      {/* FOOTER */}
      <Footer />

      {/* USER MANUAL MODAL */}
      <UserManual isOpen={manualOpen} onClose={() => setManualOpen(false)} section="family" />
    </div>
  );
}

export default FamilyProfiles;