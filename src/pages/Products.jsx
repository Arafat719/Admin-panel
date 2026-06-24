import React, { useEffect, useRef, useState, useCallback } from "react";
import Layout from "../components/Layout";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config";
import "../styles/users.css";
import "../styles/products.css";

export default function Products() {
  const { token } = useAdmin();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const debounceRef = useRef(null);

  const fetchProducts = useCallback(
    (currentPage, searchTerm) => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ page: currentPage, limit: 20 });
      if (searchTerm) params.set("search", searchTerm);

      fetch(`${API_BASE}/admin/products?${params}`, {
        headers: { "admin-token": token },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load products");
          return res.json();
        })
        .then((data) => {
          setProducts(data.products || data);
          setTotalPages(data.totalPages || 1);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [token]
  );

  useEffect(() => {
    fetchProducts(page, search);
  }, [page]);

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchProducts(1, value);
    }, 400);
  }

  async function handleDelete(productId) {
    try {
      const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
        method: "DELETE",
        headers: { "admin-token": token },
      });
      if (!res.ok) throw new Error("Delete failed");
      setConfirmDelete(null);
      fetchProducts(page, search);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(productId, status) {
    try {
      const res = await fetch(`${API_BASE}/admin/products/${productId}/status`, {
        method: "PUT",
        headers: {
          "admin-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Status update failed");
      fetchProducts(page, search);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Products">
      <div className="wmx-products">
        <div className="wmx-page-toolbar">
          <input
            className="wmx-search-input"
            type="text"
            placeholder="Search by title or seller..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="wmx-table-wrap">
          <table className="wmx-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="wmx-table-loading">Loading products...</td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={5} className="wmx-table-error">{error}</td>
                </tr>
              )}
              {!loading && !error && products.length === 0 && (
                <tr>
                  <td colSpan={5} className="wmx-table-empty">No products found.</td>
                </tr>
              )}
              {!loading && !error && products.map((product) => (
                <tr key={product._id}>
                  <td>{product.title || product.name || "—"}</td>
                  <td>{product.seller?.name || product.seller || "—"}</td>
                  <td>${(product.price ?? 0).toLocaleString()}</td>
                  <td>
                    <span className={`wmx-status-badge ${product.status || "pending"}`}>
                      {product.status || "pending"}
                    </span>
                  </td>
                  <td>
                    {confirmDelete === product._id ? (
                      <div className="wmx-confirm-inline">
                        <span>Are you sure?</span>
                        <button
                          className="wmx-confirm-yes"
                          onClick={() => handleDelete(product._id)}
                        >
                          Yes
                        </button>
                        <button
                          className="wmx-confirm-no"
                          onClick={() => setConfirmDelete(null)}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <select
                          className="wmx-status-select"
                          value={product.status || "pending"}
                          onChange={(e) => handleStatusChange(product._id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button
                          className="wmx-btn-remove"
                          onClick={() => setConfirmDelete(product._id)}
                        >
                          Remove
                        </button>
                      </div>
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
