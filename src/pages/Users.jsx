import React, { useEffect, useRef, useState, useCallback } from "react";
import Layout from "../components/Layout";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config";
import "../styles/users.css";

export default function Users() {
  const { token } = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debounceRef = useRef(null);
  const [messageModal, setMessageModal] = useState(null);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [msgSuccess, setMsgSuccess] = useState("");

  const fetchUsers = useCallback(
    (currentPage, searchTerm) => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ page: currentPage, limit: 20 });
      if (searchTerm) params.set("search", searchTerm);

      fetch(`${API_BASE}/admin/users?${params}`, {
        headers: { "admin-token": token },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load users");
          return res.json();
        })
        .then((data) => {
          setUsers(data.users || data);
          setTotalPages(data.totalPages || 1);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [token]
  );

  useEffect(() => {
    fetchUsers(page, search);
  }, [page]);

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, value);
    }, 400);
  }

  async function handleBlockToggle(user) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user._id}/block`, {
        method: "PUT",
        headers: { "admin-token": token },
      });
      if (!res.ok) throw new Error("Action failed");
      fetchUsers(page, search);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!msgSubject.trim() || !msgBody.trim()) {
      setMsgError("Subject and message are required.");
      return;
    }
    setMsgLoading(true);
    setMsgError("");
    setMsgSuccess("");
    try {
      const res = await fetch(`${API_BASE}/admin/users/${messageModal._id}/message`, {
        method: "POST",
        headers: {
          "admin-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subject: msgSubject, message: msgBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsgError(data.error || "Failed to send message.");
        return;
      }
      setMsgSuccess("Message sent successfully!");
      setMsgSubject("");
      setMsgBody("");
      setTimeout(() => {
        setMessageModal(null);
        setMsgSuccess("");
      }, 1500);
    } catch {
      setMsgError("Network error. Please try again.");
    } finally {
      setMsgLoading(false);
    }
  }

  return (
    <Layout title="Users">
      <div className="wmx-users">
        <div className="wmx-page-toolbar">
          <input
            className="wmx-search-input"
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="wmx-table-wrap">
          <table className="wmx-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Purchases</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="wmx-table-loading">Loading users...</td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={6} className="wmx-table-error">{error}</td>
                </tr>
              )}
              {!loading && !error && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="wmx-table-empty">No users found.</td>
                </tr>
              )}
              {!loading && !error && users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name || "—"}</td>
                  <td>{user.email}</td>
                  <td>
                    {(user.roles && user.roles.length > 0 ? user.roles : ["buyer"]).map((role) =>
                      role === "blocked" ? (
                        <span key={role} className="wmx-blocked-badge">{role}</span>
                      ) : (
                        <span key={role} className="wmx-role-badge">{role}</span>
                      )
                    )}
                  </td>
                  <td>{user.purchasedProductsCount ?? "—"}</td>
                  <td>
                    {user.date
                      ? new Date(user.date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    {(user.roles || []).includes("blocked") ? (
                      <button
                        className="wmx-btn-unblock"
                        onClick={() => handleBlockToggle(user)}
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        className="wmx-btn-block"
                        onClick={() => handleBlockToggle(user)}
                      >
                        Block
                      </button>
                    )}
                    <button
                      className="wmx-btn-message"
                      onClick={() => {
                        setMessageModal(user);
                        setMsgSubject("");
                        setMsgBody("");
                        setMsgError("");
                        setMsgSuccess("");
                      }}
                    >
                      Message
                    </button>
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
        {messageModal && (
          <div className="wmx-modal-overlay" onClick={() => setMessageModal(null)}>
            <div className="wmx-modal" onClick={(e) => e.stopPropagation()}>
              <div className="wmx-modal-header">
                <div className="wmx-modal-title">Message User</div>
                <div className="wmx-modal-subtitle">{messageModal.name} — {messageModal.email}</div>
              </div>

              <div className="wmx-modal-field">
                <label className="wmx-modal-label">Subject</label>
                <input
                  className="wmx-modal-input"
                  type="text"
                  placeholder="Enter subject..."
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                />
              </div>

              <div className="wmx-modal-field">
                <label className="wmx-modal-label">Message</label>
                <textarea
                  className="wmx-modal-textarea"
                  placeholder="Write your message..."
                  rows={6}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                />
              </div>

              {msgError && <div className="wmx-modal-error">{msgError}</div>}
              {msgSuccess && <div className="wmx-modal-success">{msgSuccess}</div>}

              <div className="wmx-modal-actions">
                <button
                  className="wmx-modal-cancel"
                  onClick={() => setMessageModal(null)}
                  disabled={msgLoading}
                >
                  Cancel
                </button>
                <button
                  className="wmx-modal-send"
                  onClick={handleSendMessage}
                  disabled={msgLoading}
                >
                  {msgLoading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
