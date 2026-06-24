import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config";
import "../styles/users.css";
import "../styles/finance.css";

export default function Finance() {
  const { token } = useAdmin();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/admin/finance/overview`, {
      headers: { "admin-token": token },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load finance data");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const sortedSellers = data?.sellers
    ? [...data.sellers].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
    : [];

  return (
    <Layout title="Finance">
      <div className="wmx-finance">
        {loading && <div className="wmx-finance-loading">Loading finance data...</div>}

        {error && !loading && <div className="wmx-finance-error">{error}</div>}

        {data && !loading && (
          <>
            <div className="wmx-total-revenue-card">
              <div className="wmx-total-revenue-label">Total Platform Revenue</div>
              <div className="wmx-total-revenue-value">
                ${(data.totalRevenue ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="wmx-finance-section-title">Seller Revenue Breakdown</div>

            <div className="wmx-table-wrap">
              <table className="wmx-table">
                <thead>
                  <tr>
                    <th>Seller Name</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSellers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="wmx-table-empty">No seller data available.</td>
                    </tr>
                  )}
                  {sortedSellers.map((seller, idx) => (
                    <tr key={seller._id || seller.name || idx}>
                      <td>{seller.name || seller.sellerName || "—"}</td>
                      <td>{seller.orders ?? seller.orderCount ?? "—"}</td>
                      <td style={{ color: "var(--accent)", fontWeight: 600 }}>
                        ${(seller.revenue ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
