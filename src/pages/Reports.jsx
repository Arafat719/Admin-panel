import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config";
import "../styles/users.css";
import "../styles/reports.css";

const STATUS_OPTIONS = ["all", "open", "reviewed", "resolved"];

export default function Reports() {
  const { token } = useAdmin();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = useCallback(
    (currentPage, filter) => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ page: currentPage, limit: 20 });
      if (filter && filter !== "all") params.set("status", filter);

      fetch(`${API_BASE}/admin/reports?${params}`, {
        headers: { "admin-token": token },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load reports");
          return res.json();
        })
        .then((data) => {
          setReports(data.reports || data);
          setTotalPages(data.totalPages || 1);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [token]
  );

  useEffect(() => {
    fetchReports(page, statusFilter);
  }, [page, statusFilter]);

  function handleFilterChange(e) {
    setStatusFilter(e.target.value);
    setPage(1);
  }

  async function handleStatusChange(reportId, status) {
    try {
      const res = await fetch(`${API_BASE}/admin/reports/${reportId}/status`, {
        method: "PUT",
        headers: {
          "admin-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Status update failed");
      fetchReports(page, statusFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Reports">
      <div className="wmx-reports">
        <div className="wmx-page-toolbar">
          <select
            className="wmx-status-filter"
            value={statusFilter}
            onChange={handleFilterChange}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="wmx-table-wrap">
          <table className="wmx-table">
            <thead>
              <tr>
                <th>Reported By</th>
                <th>Product</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="wmx-table-loading">Loading reports...</td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={6} className="wmx-table-error">{error}</td>
                </tr>
              )}
              {!loading && !error && reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="wmx-table-empty">No reports found.</td>
                </tr>
              )}
              {!loading && !error && reports.map((report) => (
                <tr key={report._id}>
                  <td>{report.reportedBy?.name || report.reportedBy?.userId?.name || report.reportedBy?.email || "—"}</td>
                  <td>{report.productTitle || report.productId?.title || "—"}</td>
                  <td>{report.subject || "—"}</td>
                  <td>
                    <span className={`wmx-report-status-badge ${report.status || "open"}`}>
                      {report.status || "open"}
                    </span>
                  </td>
                  <td>
                    {report.createdAt
                      ? new Date(report.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <select
                      className="wmx-report-status-select"
                      value={report.status || "open"}
                      onChange={(e) => handleStatusChange(report._id, e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
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
