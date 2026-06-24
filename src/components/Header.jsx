import React from "react";
import { useAdmin } from "../context/AdminContext";
import "../styles/header.css";

export default function Header({ title }) {
  const { admin, theme, toggleTheme } = useAdmin();

  return (
    <header className="wmx-header">
      <h1 className="wmx-header-title">{title}</h1>
      <div className="wmx-header-right">
        <span className="wmx-header-admin">
          {admin?.name || admin?.email || "Admin"}
        </span>
        <button className="wmx-header-theme-btn" onClick={toggleTheme}>
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </div>
    </header>
  );
}
