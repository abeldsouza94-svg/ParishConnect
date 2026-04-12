import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import Footer from "../components/Footer";
import "./CommunityChats.css";

function CommunityChats() {
  const navigate = useNavigate();
  const familyId = localStorage.getItem("familyId");
  const userCommunity = localStorage.getItem("userCommunity") || "None";

  // Restrict chats: Everyone sees Parish, but access depends on role/community
  let userCommunities = ["Parish"];

  if (familyId === "ADMIN" || familyId === "ADMIN01") {
    userCommunities = ["Parish", "Altar Servers", "Lectors Ministry"];
  }
  else if (familyId === "PRIEST") {
    // Priests have access to all communities
    userCommunities = ["Parish", "Altar Servers", "Lectors Ministry"];
  }
  else if (familyId === "HEAD_ALTAR") {
    userCommunities = ["Parish", "Altar Servers"];
  }
  else if (familyId === "HEAD_LECTORS") {
    userCommunities = ["Parish", "Lectors Ministry"];
  }
  
  else if (userCommunity !== "None") {
    if (userCommunity === "Altar") {
      userCommunities.push("Altar Servers");
    } 
    else if (userCommunity === "Lector") {
      userCommunities.push("Lectors Ministry");
    }
  }

  const openChat = (community) => {
    navigate(`/community-chat/${community}`);
  };

  return (
    <div className="community-page">
      <BackButton />
      <h1>Community Chats</h1>
      <p>Select a community to enter chat</p>

      <div className="community-list">
        {userCommunities.map((community) => (
          <div
            key={community}
            className="community-card"
            onClick={() => openChat(community)}
          >
            <h3>{community}</h3>
            <span>Enter Chat →</span>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}

export default CommunityChats;