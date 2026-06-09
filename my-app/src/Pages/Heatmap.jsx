import { useState, useEffect } from "react"
import { CalendarDays, X, Package } from "lucide-react"
import { CATEGORY_CONFIG } from "../config/categories"

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
const todayStr = new Date().toISOString().split("T")[0]

// Compute heat intensity level (0–5) based on relative spend
function getLevel(amount, maxAmount) {
    if (!amount || amount === 0) return 0
    const ratio = amount / maxAmount
    if (ratio <= 0.1) return 1
    if (ratio <= 0.25) return 2
    if (ratio <= 0.5) return 3
    if (ratio <= 0.75) return 4
    return 5
}

function Heatmap() {
    const now = new Date()
    const [viewMonth, setViewMonth] = useState(now.getMonth())   // 0-indexed for calendar
    const [viewYear, setViewYear] = useState(now.getFullYear())
    const [byDate, setByDate] = useState([])
    const [selectedDay, setSelectedDay] = useState(null)  // { date, total, expenses[] }
    const [loading, setLoading] = useState(true)
    const [expandedNotes, setExpandedNotes] = useState({})

    const toggleExpand = (id) => {
        setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }))
    }

    useEffect(() => {
        setLoading(true)
        const token = localStorage.getItem("spendly_token")
        const headers = token ? { "Authorization": `Bearer ${token}` } : {}
        fetch(`https://expense-backend-qh3n.onrender.com/expenses/by-date?month=${viewMonth + 1}&year=${viewYear}`, { headers })
            .then(r => r.json())
            .then(data => setByDate(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [viewMonth, viewYear])

    // Build lookup map: dateStr → { total, expenses }
    const dateMap = {}
    byDate.forEach(d => { dateMap[d.date] = d })

    const maxAmount = Math.max(...byDate.map(d => d.total), 1)

    // Build calendar grid
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()  // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    const cells = []
    // Empty leading cells
    for (let i = 0; i < firstDay; i++) cells.push(null)
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
        else setViewMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
        else setViewMonth(m => m + 1)
    }

    const canGoNext = !(viewYear === now.getFullYear() && viewMonth >= now.getMonth())

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Spending Heatmap</h1>
                <p>Visualize your spending patterns across the month</p>
            </div>

            {/* Month Navigation */}
            <div className="heatmap-nav">
                <button className="btn btn-ghost" onClick={prevMonth} id="heatmap-prev" style={{ padding: "8px 14px" }}>← Prev</button>
                <h2>{MONTHS[viewMonth]} {viewYear}</h2>
                <button
                    className="btn btn-ghost"
                    onClick={nextMonth}
                    disabled={!canGoNext}
                    id="heatmap-next"
                    style={{ padding: "8px 14px", opacity: canGoNext ? 1 : 0.3 }}
                >
                    Next →
                </button>
            </div>

            {loading ? (
                <div className="empty-state"><div className="spinner" style={{ margin: "0 auto" }} /></div>
            ) : (
                <div className="card">
                    {/* Day Labels */}
                    <div className="heatmap-grid" style={{ marginBottom: 4 }}>
                        {DAY_LABELS.map(d => (
                            <div key={d} className="heatmap-day-label">{d}</div>
                        ))}
                    </div>

                    {/* Calendar Cells */}
                    <div className="heatmap-grid">
                        {cells.map((day, i) => {
                            if (day === null) return <div key={`empty-${i}`} className="heatmap-cell empty" />

                            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                            const data = dateMap[dateStr]
                            const level = data ? getLevel(data.total, maxAmount) : 0
                            const isToday = dateStr === todayStr

                            return (
                                <div
                                    key={dateStr}
                                    id={`heatmap-day-${dateStr}`}
                                    className={`heatmap-cell level-${level}${data ? " has-data" : ""}${isToday ? " today" : ""}`}
                                    title={data ? `${fmt(data.total)} — ${data.count} expense${data.count !== 1 ? "s" : ""}` : `${day}`}
                                    onClick={() => data && setSelectedDay({ date: dateStr, ...data })}
                                    style={{ cursor: data ? "pointer" : "default" }}
                                >
                                    {day}
                                </div>
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div className="heatmap-legend">
                        <span>Low</span>
                        {[1, 2, 3, 4, 5].map(l => (
                            <div
                                key={l}
                                className="legend-swatch"
                                style={{
                                    background: [
                                        "rgba(124,58,237,0.15)",
                                        "rgba(124,58,237,0.3)",
                                        "rgba(124,58,237,0.5)",
                                        "rgba(124,58,237,0.75)",
                                        "rgba(124,58,237,1)",
                                    ][l - 1]
                                }}
                            />
                        ))}
                        <span>High</span>
                    </div>

                    {/* Monthly Summary */}
                    {byDate.length > 0 && (
                        <div style={{
                            marginTop: 20, paddingTop: 20,
                            borderTop: "1px solid var(--border)",
                            display: "flex", gap: 32, flexWrap: "wrap"
                        }}>
                            <div>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Total Spent</p>
                                <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                    {fmt(byDate.reduce((s, d) => s + d.total, 0))}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Active Days</p>
                                <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>{byDate.length}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Highest Day</p>
                                <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                    {fmt(Math.max(...byDate.map(d => d.total)))}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Day Detail Modal */}
            {selectedDay && (
                <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
                                <CalendarDays size={16} color="#22d3ee" strokeWidth={1.8} />
                                {new Date(selectedDay.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                            </h2>
                            <button className="modal-close" onClick={() => setSelectedDay(null)} style={{ display: "flex" }}><X size={18} /></button>
                        </div>

                        <p style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>
                            {fmt(selectedDay.total)}
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: 8 }}>
                                {selectedDay.count} expense{selectedDay.count !== 1 ? "s" : ""}
                            </span>
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {selectedDay.expenses.map(exp => {
                                const cfg = CATEGORY_CONFIG[exp.category] || { color: "#6b7280", Icon: Package }
                                const CatIcon = cfg.Icon
                                return (
                                     <div key={exp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid var(--border)" }}>
                                         {CatIcon && <CatIcon size={15} color={cfg.color} strokeWidth={1.7} style={{ flexShrink: 0 }} />}
                                         <div style={{ flex: 1, minWidth: 0 }}>
                                             <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 1 }}>{exp.category}</p>
                                             {exp.note && (
                                                 <p
                                                     className={`expense-note ${expandedNotes[exp.id] ? "expanded" : ""}`}
                                                     onClick={() => toggleExpand(exp.id)}
                                                     style={{
                                                         fontSize: "0.8rem",
                                                         color: "var(--text-muted)",
                                                         cursor: "pointer",
                                                         marginTop: 2
                                                     }}
                                                 >
                                                     {exp.note}
                                                 </p>
                                             )}
                                         </div>
                                         <span style={{ fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>{fmt(exp.amount)}</span>
                                     </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Heatmap
