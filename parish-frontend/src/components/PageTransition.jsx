import { useEffect, useState, useLayoutEffect } from "react";
import "./PageTransition.css";

export default function PageTransition({ children, delay = 100 }) {
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [children, delay]);

  return (
    <div className="page-transition">
<<<<<<< HEAD
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
=======
      <div className={`page-content ${isVisible ? "visible" : ""}`}>
>>>>>>> 177287f (i think its final)
        {children}
      </div>
    </div>
  );
}
