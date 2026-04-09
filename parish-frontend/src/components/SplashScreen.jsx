import { useEffect, useState } from "react";
import "./SplashScreen.css";


export default function SplashScreen({ onComplete }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 0: Logo fade in (3 second)
    const timer1 = setTimeout(() => setStage(1), 3000);
    
    // Stage 1: Hold logo (500ms)
    const timer2 = setTimeout(() => setStage(2), 1500);
    
    // Stage 2: Fade out and show content
    const timer3 = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen stage-${stage}`}>
      <div className="splash-content">
        <img 
          src="logo.png"
          alt="ParishConnect" 
          className="splash-logo"
        />
        <h1 className="splash-title">ParishConnect</h1>
      </div>
      <div className="splash-background"></div>
    </div>
  );
}
