import { Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect, useLayoutEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Donation from "./pages/Donation";
import MassBooking from "./pages/MassBooking";
import AdminDashboard from "./pages/AdminDashboard";
import PriestDashboard from "./pages/PriestDashboard";
import LectorHeadDashboard from "./pages/LectorHeadDashboard";
import AltarHeadDashboard from "./pages/AlterHeadDashboard";
import FamilyProfiles from "./pages/FamilyProfiles";
import MemberDashboard from "./pages/MemberDashboard";
import CommunityChat from "./pages/CommunityChat";
import CommunityChats from "./pages/CommunityChats";
import SplashScreen from "./components/SplashScreen";
import PageTransition from "./components/PageTransition";


function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [key, setKey] = useState(0);
  const [justExitedSplash, setJustExitedSplash] = useState(false);
  const location = useLocation();

  useLayoutEffect(() => {
    setKey(prev => prev + 1);
    setJustExitedSplash(false);
  }, [location.pathname]);

  if (showSplash) {
    return <SplashScreen onComplete={() => {
      setShowSplash(false);
      setJustExitedSplash(true);
    }} />;
  }

  const isChatRoute = location.pathname.includes("/community-chat");
  const skipAnimation = justExitedSplash;

  return (
    <PageTransition key={key} delay={skipAnimation || isChatRoute ? 0 : 300}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/donate" element={<Donation />} />
        <Route path="/mass-booking" element={<MassBooking />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/priest-dashboard" element={<PriestDashboard />} />
        <Route path="/altar-head-dashboard" element={<AltarHeadDashboard />} />
        <Route path="/lector-head-dashboard" element={<LectorHeadDashboard />} />
        <Route path="/family-profiles" element={<FamilyProfiles />} />
        <Route path="/member-dashboard" element={<MemberDashboard />} />
        <Route path="/community-chat/:community" element={<CommunityChat />} />
        <Route path="/community-chats" element={<CommunityChats />} />
      </Routes>
    </PageTransition>
  );
} 

export default App;