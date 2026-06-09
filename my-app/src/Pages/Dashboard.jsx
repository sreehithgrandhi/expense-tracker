import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { CATEGORY_CONFIG } from "../config/categories"

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

function ChartTooltip({ active, payload }) {
    if (active && payload?.length) {
        const d = payload[0]
        return (
            <div style={{ background: "#1a1b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px" }}>
                <p style={{ fontWeight: 600, color: d.payload.fill, marginBottom: 2 }}>{d.name}</p>
                <p style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>{fmt(d.value)}</p>
            </div>
        )
    }
    return null
}

function Dashboard() {
    const now = new Date()
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())
    const [availableMonths, setAvailableMonths] = useState([])
    const [byCategory, setByCategory] = useState([])
    const [allExpenses, setAllExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeIndex, setActiveIndex] = useState(-1)

    useEffect(() => {
        const token = localStorage.getItem("spendly_token")
        const headers = token ? { "Authorization": `Bearer ${token}` } : {}
        fetch("https://expense-backend-qh3n.onrender.com/expenses/months", { headers })
            .then(r => r.json())
            .then(data => {
                setAvailableMonths(data || [])
                if (data && data.length > 0) {
                    const last = data[data.length - 1]
                    setMonth(last.month)
                    setYear(last.year)
                }
            })
            .catch(console.error)
    }, [])

    useEffect(() => {
        const token = localStorage.getItem("spendly_token")
        const headers = token ? { "Authorization": `Bearer ${token}` } : {}
        const params = `?month=${month}&year=${year}`
        setLoading(true)
        Promise.all([
            fetch(`https://expense-backend-qh3n.onrender.com/expenses/by-category${params}`, { headers }).then(r => r.json()),
            fetch(`https://expense-backend-qh3n.onrender.com/expenses${params}`, { headers }).then(r => r.json()),
        ])
            .then(([cats, exps]) => { setByCategory(cats || []); setAllExpenses(exps || []) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [month, year])

    const todayStr = now.toISOString().split("T")[0]
    const todayTotal = allExpenses
        .filter(e => new Date(e.date).toISOString().split("T")[0] === todayStr)
        .reduce((s, e) => s + Number(e.amount), 0)

    const activeDays = new Set(allExpenses.map(e => new Date(e.date).toISOString().split("T")[0])).size
    const grandTotal = allExpenses.reduce((s, e) => s + Number(e.amount), 0)
    const dailyAvg = activeDays > 0 ? grandTotal / activeDays : 0
    const diffPct = dailyAvg > 0 ? ((todayTotal - dailyAvg) / dailyAvg) * 100 : 0
    const isAbove = todayTotal > dailyAvg && dailyAvg > 0
    const isBelow = todayTotal < dailyAvg && dailyAvg > 0

    const pieData = byCategory.map(cat => ({
        name: cat.category,
        value: cat.total,
        fill: CATEGORY_CONFIG[cat.category]?.color || "#6b7280",
    }))

    const TEAL = "#22d3ee"
    const TEAL_DIM = "rgba(34,211,238,0.12)"
    const TEAL_BORDER = "rgba(34,211,238,0.25)"

    return (
        <div className="page-container">

            {/* ── Header ── */}
            <div className="dashboard-header">
                <div>
                    <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", color: TEAL, textTransform: "uppercase", marginBottom: 6 }}>
                        Financial Overview
                    </p>
                    <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800 }}>Dashboard</h1>
                </div>
                <div className="dashboard-header-controls">
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: TEAL }}>
                        <span className="live-dot" />LIVE SYNC
                    </span>
                    <select
                        id="month-select"
                        className="form-select"
                        value={`${year}-${month}`}
                        onChange={e => { const [y, m] = e.target.value.split("-").map(Number); setYear(y); setMonth(m) }}
                    >
                        {availableMonths.map(({ year: y, month: m }) => (
                            <option key={`${y}-${m}`} value={`${y}-${m}`}>{MONTH_NAMES[m]} {y}</option>
                        ))}
                        {availableMonths.length === 0 && <option disabled>No data yet</option>}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><div className="spinner" style={{ margin: "0 auto" }} /></div>
            ) : (
                <>
                    {/* ── 3 Stat Cards ── */}
                    <div className="dashboard-stat-grid">

                        {/* Today's Spending */}
                        <div className="card stat-card">
                            <p className="stat-label">Today's Spending</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "10px 0 14px" }}>
                                <span className="stat-value">{fmt(todayTotal)}</span>
                                {dailyAvg > 0 && (
                                    <span style={{
                                        fontSize: "0.72rem", fontWeight: 700, padding: "2px 9px", borderRadius: 100,
                                        background: isAbove ? "rgba(239,68,68,0.12)" : TEAL_DIM,
                                        color: isAbove ? "#ef4444" : TEAL,
                                        border: `1px solid ${isAbove ? "rgba(239,68,68,0.25)" : TEAL_BORDER}`,
                                    }}>
                                        {isAbove ? "+" : ""}{diffPct.toFixed(0)}%
                                    </span>
                                )}
                            </div>
                            {/* Progress bar */}
                            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                                <div style={{
                                    height: "100%", borderRadius: 2, transition: "width 0.8s ease",
                                    width: `${dailyAvg > 0 ? Math.min(100, (todayTotal / (dailyAvg * 2)) * 100) : 0}%`,
                                    background: isAbove ? "#ef4444" : TEAL,
                                }} />
                            </div>
                        </div>

                        {/* Daily Average */}
                        <div className="card stat-card">
                            <p className="stat-label">Daily Average</p>
                            <p className="stat-value" style={{ margin: "10px 0 8px" }}>{fmt(dailyAvg)}</p>
                            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                                <span style={{ color: TEAL, fontSize: "0.9rem" }}>⚡</span>
                                {activeDays} active day{activeDays !== 1 ? "s" : ""} this period
                            </p>
                        </div>

                        {/* Spend Status */}
                        <div className="card stat-card">
                            <p className="stat-label">Spend Status</p>
                            <p className="stat-value" style={{
                                margin: "10px 0 8px",
                                color: dailyAvg === 0 ? "var(--text-muted)" : isAbove ? "#ef4444" : TEAL,
                            }}>
                                {dailyAvg === 0 ? "—" : isAbove ? `+${Math.abs(diffPct).toFixed(0)}%` : isBelow ? `−${Math.abs(diffPct).toFixed(0)}%` : "On Avg"}
                            </p>
                            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                {dailyAvg === 0 ? "No data for this month" : isAbove ? "Above daily average" : isBelow ? "Below daily average" : "Right on average"}
                            </p>
                        </div>
                    </div>

                    {/* ── Main Two-Column Layout ── */}
                    <div className="dashboard-main-layout">

                        {/* Left: Donut + Category Legend */}
                        <div className="card">
                            <p className="section-title" style={{ marginBottom: 24 }}>Spending Distribution</p>
                            {byCategory.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📭</div>
                                    <h3>No expenses this month</h3>
                                    <p>Add some expenses to see your breakdown.</p>
                                </div>
                            ) : (
                                <div className="dashboard-distribution-content">
                                    {/* Donut */}
                                    <div className="dashboard-chart-container">
                                        <ResponsiveContainer width={200} height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    strokeWidth={0}
                                                    onMouseEnter={(_, index) => setActiveIndex(index)}
                                                    onMouseLeave={() => setActiveIndex(-1)}
                                                    onClick={(_, index) => setActiveIndex(prev => prev === index ? -1 : index)}
                                                >
                                                    {pieData.map((entry, i) => (
                                                        <Cell
                                                            key={i}
                                                            fill={entry.fill}
                                                            style={{
                                                                cursor: "pointer",
                                                                outline: "none",
                                                                transition: "opacity 0.2s ease",
                                                                opacity: activeIndex === -1 || activeIndex === i ? 1 : 0.45,
                                                            }}
                                                        />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none", width: 110 }}>
                                            <p style={{ fontSize: "0.6rem", color: activeIndex !== -1 ? pieData[activeIndex].fill : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3, fontWeight: activeIndex !== -1 ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {activeIndex !== -1 ? pieData[activeIndex].name : "Total"}
                                            </p>
                                            <p style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
                                                {activeIndex !== -1 ? fmt(pieData[activeIndex].value) : fmt(grandTotal)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Category legend */}
                                    <div className="dashboard-category-legend">
                                        {byCategory.sort((a, b) => b.total - a.total).map(cat => {
                                            const cfg = CATEGORY_CONFIG[cat.category] || {}
                                            const CatIcon = cfg.Icon
                                            const pct = grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0
                                            return (
                                                <div key={cat.category}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                                        <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.83rem", color: "var(--text-secondary)" }}>
                                                            {CatIcon && <CatIcon size={13} color={cfg.color} strokeWidth={1.8} />}
                                                            {cat.category}
                                                        </span>
                                                        <span style={{ fontSize: "0.83rem", fontWeight: 700, color: "var(--text-primary)" }}>{fmt(cat.total)}</span>
                                                    </div>
                                                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", paddingLeft: 15 }}>{pct.toFixed(0)}% of total</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Category Quick List + CTA */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div className="card" style={{ flex: 1 }}>
                                <p className="section-title" style={{ marginBottom: 16 }}>By Category</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {Object.keys(CATEGORY_CONFIG).map(catName => {
                                        const data = byCategory.find(c => c.category === catName)
                                        const cfg = CATEGORY_CONFIG[catName]
                                        const CatIcon = cfg.Icon
                                        return (
                                            <div key={catName} style={{ display: "flex", alignItems: "center", gap: 11, opacity: data ? 1 : 0.28 }}>
                                                <CatIcon size={16} color={cfg.color} strokeWidth={1.7} style={{ flexShrink: 0 }} />
                                                <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{catName}</span>
                                                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: data ? "var(--text-primary)" : "var(--text-muted)" }}>
                                                    {data ? fmt(data.total) : "₹0"}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <Link to="/add" className="btn btn-full" style={{
                                background: `linear-gradient(135deg, #0891b2, ${TEAL})`,
                                color: "#fff",
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                fontSize: "0.82rem",
                                textTransform: "uppercase",
                                padding: "14px",
                                borderRadius: "var(--radius-sm)",
                                boxShadow: `0 4px 24px ${TEAL_DIM}`,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                transition: "all 0.2s ease",
                            }}>
                                + New Transaction
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default Dashboard
