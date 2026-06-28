import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
  LineController,
  BarController,
  DoughnutController,
} from "chart.js";
import "./PlatformAnalytics.css";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
  LineController,
  BarController,
  DoughnutController
);

const TIME_RANGES = ["7d", "30d", "All time"];

const RANGE_CONFIG = {
  "7d": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    count: 7,
  },
  "30d": {
    labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5"],
    count: 5,
  },
  "All time": {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    count: 12,
  },
};

const ACTIVITY = [
  { icon: "◈", badge: "wmx-badge-order",  title: "New order placed",    subtitle: "Order #10042 · $149.00",             time: "2m ago"  },
  { icon: "◉", badge: "wmx-badge-user",   title: "User registered",     subtitle: "john_doe joined the platform",        time: "14m ago" },
  { icon: "⚑", badge: "wmx-badge-report", title: "Report submitted",    subtitle: "Listing #883 flagged for review",     time: "1h ago"  },
  { icon: "◆", badge: "wmx-badge-user",   title: "New seller verified", subtitle: "ShopZone Pro · 12 products listed",  time: "3h ago"  },
];

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
};

// Deterministic growth curve anchored to finalVal at the last point
function genSeries(finalVal, count) {
  const v = finalVal || 0;
  if (count <= 0) return [];
  if (count === 1) return [v];
  const start = Math.max(1, Math.round(v * 0.28));
  return Array.from({ length: count }, (_, i) => {
    if (i === count - 1) return v;
    const t = i / (count - 1);
    const wave = Math.sin(i * 1.5) * 0.05 * v;
    return Math.round(Math.max(1, start + (v - start) * t + wave));
  });
}

function pct(a, b) {
  if (!b) return 0;
  return Math.round(((a ?? 0) / b) * 100);
}

function avgPerSeller(products, sellers) {
  if (!sellers) return "0";
  return ((products ?? 0) / sellers).toFixed(1);
}

function readThemeColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    colorAccent:  cs.getPropertyValue("--accent").trim(),
    colorSuccess: cs.getPropertyValue("--success").trim(),
    colorWarning: cs.getPropertyValue("--warning").trim(),
    colorBorder:  cs.getPropertyValue("--border").trim(),
    colorMuted:   cs.getPropertyValue("--text-muted").trim(),
  };
}

function makeAxisStyle(colorBorder, colorMuted) {
  return {
    border: { color: "transparent" },
    grid: { color: colorBorder },
    ticks: { color: colorMuted, font: { size: 11 } },
  };
}

export default function PlatformAnalytics({ stats }) {
  const [range, setRange] = useState("30d");
  const [themeKey, setThemeKey] = useState(
    () => document.documentElement.getAttribute("data-theme") || "dark"
  );

  const lineRef   = useRef(null);
  const funnelRef = useRef(null);
  const donutRef  = useRef(null);

  const lineInst   = useRef(null);
  const funnelInst = useRef(null);
  const donutInst  = useRef(null);

  // Watch for data-theme attribute changes and trigger chart rebuilds
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeKey(document.documentElement.getAttribute("data-theme") || "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Pre-compute mock series for all ranges once, keyed to real stats values
  const mockSeries = useMemo(() => {
    if (!stats) return null;
    const out = {};
    for (const [key, cfg] of Object.entries(RANGE_CONFIG)) {
      out[key] = {
        labels: cfg.labels,
        users:  genSeries(stats.users, cfg.count),
        orders: genSeries(stats.orders, cfg.count),
      };
    }
    return out;
  }, [stats]);

  // Line chart — rebuilds when range, data, or theme changes
  useEffect(() => {
    if (!mockSeries || !lineRef.current) return;
    if (lineInst.current) { lineInst.current.destroy(); lineInst.current = null; }

    const { colorAccent, colorSuccess, colorBorder, colorMuted } = readThemeColors();
    const axisStyle = makeAxisStyle(colorBorder, colorMuted);
    const d = mockSeries[range];

    lineInst.current = new Chart(lineRef.current, {
      type: "line",
      data: {
        labels: d.labels,
        datasets: [
          {
            label: "Users",
            data: d.users,
            borderColor: colorAccent,
            backgroundColor: colorAccent + "1a",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colorAccent,
            borderWidth: 2,
          },
          {
            label: "Orders",
            data: d.orders,
            borderColor: colorSuccess,
            backgroundColor: colorSuccess + "1a",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: colorSuccess,
            borderWidth: 2,
          },
        ],
      },
      options: {
        ...CHART_DEFAULTS,
        scales: {
          x: { ...axisStyle },
          y: { ...axisStyle, beginAtZero: true },
        },
      },
    });

    return () => {
      if (lineInst.current) { lineInst.current.destroy(); lineInst.current = null; }
    };
  }, [range, mockSeries, themeKey]);

  // Funnel chart — rebuilds when stats or theme changes
  useEffect(() => {
    if (!stats || !funnelRef.current) return;
    if (funnelInst.current) { funnelInst.current.destroy(); funnelInst.current = null; }

    const { colorAccent, colorSuccess, colorWarning, colorBorder, colorMuted } = readThemeColors();
    const axisStyle = makeAxisStyle(colorBorder, colorMuted);

    funnelInst.current = new Chart(funnelRef.current, {
      type: "bar",
      data: {
        labels: ["Users", "Sellers", "Products", "Orders"],
        datasets: [{
          data: [stats.users ?? 0, stats.sellers ?? 0, stats.products ?? 0, stats.orders ?? 0],
          backgroundColor: [colorAccent, colorSuccess, "#4a3aa7", colorWarning],
          borderWidth: 0,
          borderRadius: 4,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        indexAxis: "y",
        scales: {
          x: { ...axisStyle, beginAtZero: true },
          y: { ...axisStyle, grid: { color: "transparent" } },
        },
      },
    });

    return () => {
      if (funnelInst.current) { funnelInst.current.destroy(); funnelInst.current = null; }
    };
  }, [stats, themeKey]);

  // Donut chart — rebuilds when stats or theme changes
  useEffect(() => {
    if (!stats || !donutRef.current) return;
    if (donutInst.current) { donutInst.current.destroy(); donutInst.current = null; }

    const { colorAccent, colorBorder } = readThemeColors();
    const sellers    = stats.sellers ?? 0;
    const buyersOnly = Math.max(0, (stats.users ?? 0) - sellers);

    donutInst.current = new Chart(donutRef.current, {
      type: "doughnut",
      data: {
        labels: ["Sellers", "Buyers only"],
        datasets: [{
          data: [sellers, buyersOnly],
          backgroundColor: [colorAccent, colorBorder],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        cutout: "72%",
      },
    });

    return () => {
      if (donutInst.current) { donutInst.current.destroy(); donutInst.current = null; }
    };
  }, [stats, themeKey]);

  if (!stats) return null;

  const sellers    = stats.sellers ?? 0;
  const totalUsers = stats.users ?? 0;
  const buyersOnly = Math.max(0, totalUsers - sellers);
  const pendingRep = stats.pendingReports ?? 0;
  const revenue    = stats.revenue ?? 0;

  const kpiCards = [
    {
      key: "users",
      label: "Users",
      value: totalUsers.toLocaleString(),
      subtitle: "total registered",
      warn: false,
    },
    {
      key: "sellers",
      label: "Sellers",
      value: sellers.toLocaleString(),
      subtitle: `${pct(sellers, totalUsers)}% of users`,
      warn: false,
    },
    {
      key: "products",
      label: "Products",
      value: (stats.products ?? 0).toLocaleString(),
      subtitle: `avg ${avgPerSeller(stats.products, sellers)} per seller`,
      warn: false,
    },
    {
      key: "orders",
      label: "Orders",
      value: (stats.orders ?? 0).toLocaleString(),
      subtitle: "total placed",
      warn: false,
    },
    {
      key: "revenue",
      label: "Revenue",
      value: `$${revenue.toLocaleString()}`,
      subtitle: revenue === 0 ? "free tier active" : null,
      warn: false,
    },
    {
      key: "pendingReports",
      label: "Pending Reports",
      value: pendingRep.toLocaleString(),
      subtitle: pendingRep > 0 ? "needs attention" : null,
      warn: pendingRep > 0,
    },
  ];

  return (
    <div className="wmx-analytics-wrap">

      {/* Time Range Tabs */}
      <div className="wmx-analytics-tabs">
        {TIME_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            className={`wmx-analytics-tab${range === r ? " active" : ""}`}
            onClick={() => setRange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="wmx-kpi-grid">
        {kpiCards.map((card) => (
          <div key={card.key} className={`wmx-kpi-card${card.warn ? " wmx-kpi-warn" : ""}`}>
            <span className="wmx-kpi-label">{card.label}</span>
            <span className="wmx-kpi-value">{card.value}</span>
            {card.subtitle && (
              <span className={`wmx-kpi-subtitle${card.warn ? " wmx-kpi-subtitle-warn" : ""}`}>
                {card.subtitle}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Growth Line Chart */}
      <div className="wmx-analytics-chart-card">
        <div className="wmx-analytics-chart-header">
          <span className="wmx-analytics-chart-title">Growth</span>
          <div className="wmx-chart-legend">
            <div className="wmx-legend-item">
              <div className="wmx-legend-dot" style={{ background: "var(--accent)" }} />
              <span>Users</span>
            </div>
            <div className="wmx-legend-item">
              <div className="wmx-legend-dot" style={{ background: "var(--success)" }} />
              <span>Orders</span>
            </div>
          </div>
        </div>
        <div className="wmx-canvas-wrap">
          <canvas ref={lineRef} />
        </div>
      </div>

      {/* Two-Column: Funnel + Donut */}
      <div className="wmx-analytics-row">

        {/* Conversion Funnel */}
        <div className="wmx-analytics-chart-card">
          <div className="wmx-analytics-chart-header">
            <span className="wmx-analytics-chart-title">Conversion Funnel</span>
          </div>
          <div className="wmx-canvas-wrap-sm">
            <canvas ref={funnelRef} />
          </div>
        </div>

        {/* User Breakdown Donut */}
        <div className="wmx-analytics-chart-card">
          <div className="wmx-analytics-chart-header">
            <span className="wmx-analytics-chart-title">User Breakdown</span>
          </div>
          <div className="wmx-donut-wrap">
            <div className="wmx-donut-canvas-wrap">
              <canvas ref={donutRef} />
            </div>
            <div className="wmx-donut-legend">
              <div className="wmx-donut-legend-item">
                <div className="wmx-donut-legend-dot" style={{ background: "var(--accent)" }} />
                <div>
                  <div className="wmx-donut-legend-label">Sellers</div>
                  <div className="wmx-donut-legend-val">{sellers.toLocaleString()}</div>
                </div>
              </div>
              <div className="wmx-donut-legend-item">
                <div className="wmx-donut-legend-dot" style={{ background: "var(--border)" }} />
                <div>
                  <div className="wmx-donut-legend-label">Buyers only</div>
                  <div className="wmx-donut-legend-val">{buyersOnly.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity */}
      <div>
        <div className="wmx-activity-section-title">Recent Activity</div>
        <div className="wmx-activity-list">
          {ACTIVITY.map((item, i) => (
            <div key={i} className="wmx-activity-row">
              <div className={`wmx-activity-badge ${item.badge}`}>{item.icon}</div>
              <div className="wmx-activity-info">
                <div className="wmx-activity-title">{item.title}</div>
                <div className="wmx-activity-subtitle">{item.subtitle}</div>
              </div>
              <div className="wmx-activity-time">{item.time}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
