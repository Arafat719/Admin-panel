import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import "../styles/sidebar.css";

function WmxLogo({ size = 28 }) {
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

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "⊞" },
  { to: "/users", label: "Users", icon: "◉" },
  { to: "/products", label: "Products", icon: "⬡" },
  { to: "/orders", label: "Orders", icon: "◈" },
  { to: "/finance", label: "Finance", icon: "◆" },
  { to: "/reports", label: "Reports", icon: "⚑" },
  { to: "/notifications", label: "Messages", icon: "✉" },
];

export default function Sidebar() {
  const { logout } = useAdmin();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="wmx-sidebar">
      <div className="wmx-sidebar-logo">
        <WmxLogo size={28} />
        <span className="wmx-sidebar-logo-text">WebMarketX Admin</span>
      </div>

      <nav className="wmx-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              "wmx-sidebar-link" + (isActive ? " active" : "")
            }
          >
            <span className="wmx-sidebar-link-icon">{item.icon}</span>
            <span className="wmx-sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="wmx-sidebar-bottom">
        <button className="wmx-sidebar-logout" onClick={handleLogout}>
          <span className="wmx-sidebar-link-icon">⏻</span>
          <span className="wmx-sidebar-logout-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
