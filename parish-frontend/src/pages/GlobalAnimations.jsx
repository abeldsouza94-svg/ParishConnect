import React, { useState, useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import "./GlobalAnimations.css";
import logo from "../assets/logo.png";
import line from "../assets/line.png";

const GlobalAnimations = ({ children }) => {
  const location = useLocation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  // Handle Initial Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 2800); // Slightly longer to allow the CSS fade-out to finish
    return () => clearTimeout(timer);
  }, []);

  // Handle Page Change Line Animation - use useLayoutEffect to avoid setState warning
  useLayoutEffect(() => {
    if (isInitialLoad) return;

    setIsTransitioning(true);
    
    // Create a soothing delay before switching the view
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 600); 

    return () => clearTimeout(timer);
  }, [location.pathname, children, isInitialLoad]);

  return (
    <>
      {isInitialLoad && (
        <div className="splash-screen">
          <img src={logo} alt="Parish Logo" className="splash-logo" />
        </div>
      )}

      <div className={`transition-line-overlay ${isTransitioning ? "show" : ""}`}>
        <img src={line} alt="Loading..." className="transition-line" />
      </div>

      <div className={`main-content-wrapper ${isInitialLoad || isTransitioning ? "hidden" : "visible"}`}>
        {displayChildren}
      </div>
    </>
  );
};

export default GlobalAnimations;