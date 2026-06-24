import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import "../styles/sidebar.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "⊞" },
  { to: "/users", label: "Users", icon: "◉" },
  { to: "/products", label: "Products", icon: "⬡" },
  { to: "/orders", label: "Orders", icon: "◈" },
  { to: "/finance", label: "Finance", icon: "◆" },
  { to: "/reports", label: "Reports", icon: "⚑" },
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
        <div className="wmx-sidebar-logo-icon">W</div>
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
