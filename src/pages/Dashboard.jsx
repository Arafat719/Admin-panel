import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAdmin } from "../context/AdminContext";
import { API_BASE } from "../config";
import "../styles/dashboard.css";

const STAT_KEYS = [
  { key: "users", label: "Users", icon: "◉", modifier: "users" },
  { key: "sellers", label: "Sellers", icon: "◆", modifier: "sellers" },
  { key: "products", label: "Products", icon: "⬡", modifier: "products" },
  { key: "orders", label: "Orders", icon: "◈", modifier: "orders" },
  { key: "revenue", label: "Revenue", icon: "◎", modifier: "revenue", prefix: "$" },
  { key: "pendingReports", label: "Pending Reports", icon: "⚑", modifier: "reports" },
];

const CHART_KEYS = [
  { key: "users", label: "Users" },
  { key: "sellers", label: "Sellers" },
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "pendingReports", label: "Reports" },
];

export default function Dashboard() {
  const { token } = useAdmin();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/admin/dashboard/stats`, {
      headers: { "admin-token": token },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then((data) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  function formatValue(key, value) {
    const item = STAT_KEYS.find((s) => s.key === key);
    const prefix = item?.prefix || "";
    if (typeof value === "number") {
      return prefix + value.toLocaleString();
    }
    return prefix + (value ?? "—");
  }

  function buildChartData(s) {
    const values = CHART_KEYS.map((c) => s[c.key] ?? 0);
    const maxValue = Math.max(...values, 1);
    return CHART_KEYS.map((c, i) => ({
      label: c.label,
      value: values[i],
      height: Math.max(4, Math.min(100, (values[i] / maxValue) * 100)),
    }));
  }

  return (
    <Layout title="Dashboard">
      <div className="wmx-dashboard">
        {loading && (
          <>
            <div className="wmx-stats-grid">
              {STAT_KEYS.map((s) => (
                <div key={s.key} className="wmx-stat-skeleton">
                  <div className="wmx-skeleton-label" />
                  <div className="wmx-skeleton-value" />
                </div>
              ))}
            </div>
            <div className="wmx-chart-section">
              <div
                className="wmx-skeleton"
                style={{ height: "14px", width: "140px", marginBottom: "20px" }}
              />
              <div className="wmx-bar-chart">
                {CHART_KEYS.map((c) => (
                  <div key={c.key} className="wmx-bar-wrap">
                    <div
                      className="wmx-skeleton"
                      style={{ width: "100%", height: "60px", borderRadius: "4px" }}
                    />
                    <div
                      className="wmx-skeleton"
                      style={{ width: "40px", height: "11px", borderRadius: "3px", marginTop: "6px" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {error && !loading && (
          <div className="wmx-dashboard-error">{error}</div>
        )}

        {stats && !loading && (
          <>
            <p className="wmx-dashboard-section-title">Overview</p>
            <div className="wmx-stats-grid">
              {STAT_KEYS.map((s) => (
                <div key={s.key} className={`wmx-stat-card ${s.modifier}`}>
                  <div className="wmx-stat-header">
                    <span className="wmx-stat-label">{s.label}</span>
                    <div className="wmx-stat-icon">{s.icon}</div>
                  </div>
                  <div className="wmx-stat-value">{formatValue(s.key, stats[s.key])}</div>
                </div>
              ))}
            </div>

            <div className="wmx-chart-section">
              <div className="wmx-chart-title">Platform Overview</div>
              <div className="wmx-bar-chart">
                {buildChartData(stats).map((item) => (
                  <div className="wmx-bar-wrap" key={item.label}>
                    <div
                      className="wmx-bar"
                      style={{ height: item.height + "px" }}
                      title={item.value.toLocaleString()}
                    />
                    <span className="wmx-bar-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
