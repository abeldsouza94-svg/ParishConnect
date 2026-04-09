import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Login.css";
import BackButton from "../components/BackButton";

const API_BASE = "http://localhost:5000";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (username === "ADMIN01" && password === "adminpass") {
        localStorage.setItem("familyId", "ADMIN");
        localStorage.setItem("userName", "System Admin");
        navigate("/admin-dashboard");
      } 
      else if (username.startsWith("HEAD_LECTORS") && password === "lectorpass") {
        localStorage.setItem("familyId", "HEAD_LECTORS");
        localStorage.setItem("userName", "Head of Lectors");
        navigate("/lector-head-dashboard");
      } 
      else if ((username.startsWith("HEAD_ALTAR") || username.startsWith("HEAD_ALTER")) && password === "altarpass") {
        localStorage.setItem("familyId", "HEAD_ALTAR");
        localStorage.setItem("userName", "Head of Altar Servers");
        navigate("/altar-head-dashboard");
      }
      else if (username === "PRIEST" && password === "priestpass") {
        localStorage.setItem("familyId", "PRIEST");
        localStorage.setItem("userName", "Parish Priest");
        navigate("/priest-dashboard");
      }
      else {
        const res = await fetch(`${API_BASE}/families/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ familyId: username, password })
        });
        if (res.ok) {
          localStorage.setItem("familyId", username);
          navigate("/family-profiles");
        } else {
          setError("Invalid User ID or Password");
        }
      }
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <BackButton />

      <div className="login-header">
        <img src="src/assets/logo2.png" alt="ParishConnect Logo" className="login-logo" />
        <h3>Secure Access Portal</h3>
      </div>

      <form className="login-card" onSubmit={handleLogin}>
        <h2>Sign In to Your Account</h2>

        <p className="subtext">
          Enter your Unique ID and password provided by the parish office.
        </p>

        {error && <div className="login-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="username">Unique User ID</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your ID"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <div className="password-row">
            <label htmlFor="password">Password</label>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary login-submit"
          disabled={isLoading}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="login-footer">
        <p>Need help? Contact the parish office for assistance.</p>
      </div>
    </div>
  );
}

export default Login;