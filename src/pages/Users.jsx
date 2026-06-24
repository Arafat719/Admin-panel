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
