import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config";
import "../styles/login.css";

function WmxLogo({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <rect width="36" height="36" rx="8" fill="#8682fa" />
      <polyline
        points="6,24 12,10 18,22 24,10 30,24"
        fill="none"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="29" cy="8" r="5" fill="white" opacity="0.95" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAdmin();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed. Check your credentials.");
        return;
      }

      login(data.token, data.admin);
      navigate("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wmx-login-page">
      <div className="wmx-login-card">
        <div className="wmx-login-logo">
          <WmxLogo size={36} />
          <span className="wmx-login-logo-text">WebMarketX Admin</span>
        </div>
        <div className="wmx-login-title">Sign in</div>
        <div className="wmx-login-subtitle">Access the admin control panel</div>

        <form onSubmit={handleSubmit}>
          <div className="wmx-login-field">
            <label className="wmx-login-label" htmlFor="wmx-email">
              Email
            </label>
            <input
              id="wmx-email"
              className="wmx-login-input"
              type="email"
              placeholder="admin@webmarketx.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="wmx-login-field">
            <label className="wmx-login-label" htmlFor="wmx-password">
              Password
            </label>
            <input
              id="wmx-password"
              className="wmx-login-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="wmx-login-error">{error}</div>}

          <button className="wmx-login-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
