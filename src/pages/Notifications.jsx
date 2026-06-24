import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config";
import "../styles/users.css";
import "../styles/notifications.css";

export default function Notifications() {
  const { token } = useAdmin();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);

  const fetchNotifications = useCallback(
    (currentPage) => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ page: currentPage, limit: 20 });

      fetch(`${API_BASE}/admin/notifications?${params}`, {
        headers: { "admin-token": token },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load notifications");
          return res.json();
        })
        .then((data) => {
          setNotifications(data.notifications || []);
          setTotalPages(data.totalPages || 1);
          setTotalNotifications(data.totalNotifications || 0);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [token]
  );

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  return (
    <Layout title="Notifications">
      <div className="wmx-notifications">
        <div className="wmx-notif-page-header">
          <div className="wmx-notif-page-title">Message History</div>
          <div className="wmx-notif-page-count">{totalNotifications} total</div>
        </div>

        <div className="wmx-table-wrap">
          <table className="wmx-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Status</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="wmx-table-loading">Loading...</td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={6} className="wmx-table-error">{error}</td>
                </tr>
              )}
              {!loading && !error && notifications.length === 0 && (
                <tr>
                  <td colSpan={6} className="wmx-table-empty">No messages sent yet.</td>
                </tr>
              )}
              {!loading && !error && notifications.map((n) => (
                <tr key={n._id}>
                  <td>{n.userId?.name || "—"}</td>
                  <td>{n.userId?.email || "—"}</td>
                  <td className="wmx-notif-subject">{n.title || "—"}</td>
                  <td className="wmx-notif-msg-preview">{n.message || "—"}</td>
                  <td>
                    {n.read ? (
                      <span className="wmx-notif-status-badge read">Seen ✓</span>
                    ) : (
                      <span className="wmx-notif-status-badge unread">Pending</span>
                    )}
                  </td>
                  <td>
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="wmx-pagination">
          <button
            className="wmx-pagination-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span className="wmx-pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="wmx-pagination-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </Layout>
  );
}
