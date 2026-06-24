import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config";
import "../styles/users.css";
import "../styles/orders.css";

export default function Orders() {
  const { token } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(
    (currentPage) => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ page: currentPage, limit: 20 });

      fetch(`${API_BASE}/admin/orders?${params}`, {
        headers: { "admin-token": token },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load orders");
          return res.json();
        })
        .then((data) => {
          setOrders(data.orders || data);
          setTotalPages(data.totalPages || 1);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [token]
  );

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  async function handleStatusChange(orderId, status) {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "admin-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Status update failed");
      fetchOrders(page);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Orders">
      <div className="wmx-orders">
        <div className="wmx-table-wrap">
          <table className="wmx-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="wmx-table-loading">Loading orders...</td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={7} className="wmx-table-error">{error}</td>
                </tr>
              )}
              {!loading && !error && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="wmx-table-empty">No orders found.</td>
                </tr>
              )}
              {!loading && !error && orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <span className="wmx-order-id">
                      {(order._id || "").slice(0, 8)}
                    </span>
                  </td>
                  <td>{order.buyer?.name || order.buyer?.email || order.buyer || "—"}</td>
                  <td>{order.product?.title || order.product?.name || order.product || "—"}</td>
                  <td className="wmx-order-amount">
                    ${(order.amount ?? order.total ?? 0).toLocaleString()}
                  </td>
                  <td>
                    <span className={`wmx-status-badge ${order.status || "pending"}`}
                      style={{
                        display: "inline-block",
                        borderRadius: "4px",
                        padding: "2px 8px",
                        fontSize: "12px",
                        fontWeight: 500,
                        background:
                          order.status === "completed"
                            ? "rgba(76,175,80,0.15)"
                            : order.status === "cancelled"
                            ? "rgba(244,67,54,0.15)"
                            : "rgba(255,152,0,0.15)",
                        color:
                          order.status === "completed"
                            ? "var(--success)"
                            : order.status === "cancelled"
                            ? "var(--danger)"
                            : "var(--warning)",
                      }}
                    >
                      {order.status || "pending"}
                    </span>
                  </td>
                  <td>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <select
                      className="wmx-order-status-select"
                      value={order.status || "pending"}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
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
