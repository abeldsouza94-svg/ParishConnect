import { useNavigate } from "react-router-dom";
import "./BackButton.css";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      className="back-button"
      onClick={() => navigate(-1)}
      title="Go back"
      aria-label="Go back"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
  );
}
