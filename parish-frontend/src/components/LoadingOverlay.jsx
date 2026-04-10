import React from "react";
import "./LoadingOverlay.css";

export default function LoadingOverlay({ isLoading, message = "Loading..." }) {
  return (
    <>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-overlay-backdrop" />
          <div className="loading-overlay-content">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p className="loading-message">{message}</p>
          </div>
        </div>
      )}
    </>
  );
}
