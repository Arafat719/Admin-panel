import React from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

export default function ProtectedRoute({ children }) {
  const { token, authLoading } = useAdmin();

  if (authLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Verifying session...</span>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
