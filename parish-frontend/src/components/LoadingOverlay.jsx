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
              <img src="/line.png" alt="loading" className="custom-line-loader" />
            </div>
            <p className="loading-message">{message}</p>
          </div>
        </div>
      )}
    </>
  );
}
