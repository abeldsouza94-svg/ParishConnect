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
      <div className={`page-content ${isVisible ? "visible" : ""}`}>
        {children}
      </div>
    </div>
  );
}
