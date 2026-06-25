import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API_BASE, ADMIN_TOKEN_KEY } from "../config";

export const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [authLoading, setAuthLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [reloadTick, setReloadTick] = useState(0);

  const triggerReload = useCallback(() => {
    setReloadTick((t) => t + 1);
    setCountdown(30);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setReloadTick((t) => t + 1);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("wmx_admin_theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!savedToken) {
      setAuthLoading(false);
      return;
    }

    fetch(`${API_BASE}/admin/verify`, {
      headers: { "admin-token": savedToken },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        setToken(savedToken);
        setAdmin(data.admin || data);
      })
      .catch(() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setAdmin(null);
        setToken(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  function login(newToken, adminData) {
    localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
    setToken(newToken);
    setAdmin(adminData);
  }

  function logout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setAdmin(null);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("wmx_admin_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <AdminContext.Provider value={{ admin, token, theme, authLoading, login, logout, toggleTheme, countdown, reloadTick, triggerReload }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
