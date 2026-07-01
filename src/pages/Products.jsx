import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Layout from "../components/Layout";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config";
import "../styles/users.css";
import "../styles/products.css";

const HIDDEN_DETAIL_KEYS = new Set([
  "_id",
  "id",
  "__v",
  "title",
  "name",
  "description",
  "price",
  "status",
  "seller",
  "category",
  "stock",
  "quantity",
  "images",
  "image",
  "createdAt",
  "updatedAt",
]);

function ProductDetailModal({ product, onClose }) {
  if (!product) return null;

  const images = Array.isArray(product.images)
    ? product.images
    : product.image
    ? [product.image]
    : [];
  const [heroImage, ...thumbImages] = images;

  const extraEntries = Object.entries(product).filter(
    ([key, value]) =>
      !HIDDEN_DETAIL_KEYS.has(key) &&
      value !== null &&
      value !== undefined &&
      typeof value !== "object"
  );

  return (
    <div className="wmx-modal-overlay" onClick={onClose}>
      <div className="wmx-modal wmx-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wmx-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {heroImage && (
          <div className="wmx-detail-hero">
            <img src={heroImage} alt={product.title || product.name || "product"} />
          </div>
        )}

        <div className="wmx-detail-body">
          <div className="wmx-detail-top">
            <div>
              <div className="wmx-modal-title">{product.title || product.name || "Product Details"}</div>
              <div className="wmx-modal-subtitle">ID: {product._id}</div>
            </div>
            <span className={`wmx-status-badge ${product.status || "pending"}`}>
              {product.status || "pending"}
            </span>
          </div>

          <div className="wmx-detail-price">${(product.price ?? 0).toLocaleString()}</div>

          {thumbImages.length > 0 && (
            <div className="wmx-detail-thumbs">
              {thumbImages.map((src, i) => (
                <img key={i} src={src} alt={`${product.title || product.name || "product"} ${i + 2}`} />
              ))}
            </div>
          )}

          <div className="wmx-detail-chips">
            {product.category && (
              <div className="wmx-detail-chip">
                <span className="wmx-modal-label">Category</span>
                <span>{product.category}</span>
              </div>
            )}
            {(product.stock ?? product.quantity) !== undefined && (
              <div className="wmx-detail-chip">
                <span className="wmx-modal-label">Stock</span>
                <span>{product.stock ?? product.quantity}</span>
              </div>
            )}
            <div className="wmx-detail-chip">
              <span className="wmx-modal-label">Seller</span>
              <span>{product.seller?.name || product.seller?.email || product.seller || "—"}</span>
            </div>
            {product.createdAt && (
              <div className="wmx-detail-chip">
                <span className="wmx-modal-label">Created</span>
                <span>{new Date(product.createdAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          {product.description && (
            <div className="wmx-detail-section">
              <label className="wmx-modal-label">Description</label>
              <div className="wmx-modal-detail-description">{product.description}</div>
            </div>
          )}

          {extraEntries.length > 0 && (
            <div className="wmx-detail-section">
              <label className="wmx-modal-label">Additional Info</label>
              <div className="wmx-detail-extra-grid">
                {extraEntries.map(([key, value]) => (
                  <div className="wmx-detail-extra-row" key={key}>
                    <span className="wmx-detail-extra-key">{key}</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="wmx-modal-actions wmx-detail-footer">
          <button className="wmx-modal-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { token } = useAdmin();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [detailProduct, setDetailProduct] = useState(null);
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

  function handleSort(field) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  }

  const sortedProducts = useMemo(() => {
    if (!sortBy) return products;
    const list = [...products];
    list.sort((a, b) => {
      let av, bv;
      if (sortBy === "title") {
        av = (a.title || a.name || "").toLowerCase();
        bv = (b.title || b.name || "").toLowerCase();
      } else if (sortBy === "price") {
        av = a.price ?? 0;
        bv = b.price ?? 0;
      } else {
        av = a.status || "pending";
        bv = b.status || "pending";
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [products, sortBy, sortDir]);

  function sortArrow(field) {
    if (sortBy !== field) return null;
    return sortDir === "asc" ? " ▲" : " ▼";
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
                <th className="wmx-sortable-th" onClick={() => handleSort("title")}>
                  Title{sortArrow("title")}
                </th>
                <th>Seller</th>
                <th className="wmx-sortable-th" onClick={() => handleSort("price")}>
                  Price{sortArrow("price")}
                </th>
                <th className="wmx-sortable-th" onClick={() => handleSort("status")}>
                  Status{sortArrow("status")}
                </th>
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
              {!loading && !error && sortedProducts.map((product) => (
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
                          className="wmx-btn-details"
                          onClick={() => setDetailProduct(product)}
                        >
                          Details
                        </button>
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

        <ProductDetailModal product={detailProduct} onClose={() => setDetailProduct(null)} />
      </div>
    </Layout>
  );
}
