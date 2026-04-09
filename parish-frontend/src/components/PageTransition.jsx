import { useEffect, useState, useLayoutEffect } from "react";
import "./PageTransition.css";

export default function PageTransition({ children, delay = 400 }) {
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [children, delay]);

  return (
    <div className="page-transition">
      {isLoading && (
        <div className="page-loader">
          <div className="loader-content">
            <img 
                src="/line.png" 
              alt="loading" 
              className="loader-animation" 
            />
          </div>
        </div>
      )}
      <div className={`page-content ${!isLoading ? "visible" : ""}`}>
        {children}
      </div>
    </div>
  );
}
