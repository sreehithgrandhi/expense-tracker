import { useState, useEffect, useCallback } from "react"
import { Trash2, Package } from "lucide-react"
import { CATEGORY_CONFIG } from "../config/categories"

const MONTHS = [
    "All Time", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

const CATEGORIES_ALL = ["All", ...Object.keys(CATEGORY_CONFIG)]

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

function formatDate(d) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function History() {
    const now = new Date()
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
    const [filterCat, setFilterCat] = useState("All")
    const [confirmDeleteId, setConfirmDeleteId] = useState(null)

    const fetchExpenses = useCallback(async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("spendly_token")
            const headers = token ? { "Authorization": `Bearer ${token}` } : {}
            const params = filterMonth === 0
                ? ""
                : `?month=${filterMonth}&year=${now.getFullYear()}`
            const data = await fetch(`https://expense-backend-qh3n.onrender.com/expenses${params}`, { headers }).then(r => r.json())
            setExpenses(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [filterMonth])

    useEffect(() => { fetchExpenses() }, [fetchExpenses])

    const handleDelete = async (id) => {
        const token = localStorage.getItem("spendly_token")
        const headers = token ? { "Authorization": `Bearer ${token}` } : {}
        await fetch(`https://expense-backend-qh3n.onrender.com/expenses/${id}`, {
            method: "DELETE",
            headers
        })
        setConfirmDeleteId(null)
        fetchExpenses()
    }

    const filtered = filterCat === "All"
        ? expenses
        : expenses.filter(e => e.category === filterCat)

    const total = filtered.reduce((s, e) => s + Number(e.amount), 0)

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Expense History</h1>
                <p>All your recorded transactions</p>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <select
                    id="history-month-filter"
                    className="form-select"
                    value={filterMonth}
                    onChange={e => setFilterMonth(Number(e.target.value))}
                >
                    {MONTHS.map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                    ))}
                </select>
                <select
                    id="history-cat-filter"
                    className="form-select"
                    value={filterCat}
                    onChange={e => setFilterCat(e.target.value)}
                >
                    {CATEGORIES_ALL.map(c => (
                        <option key={c} value={c}>{c === "All" ? "All Categories" : `${CATEGORY_CONFIG[c]?.icon} ${c}`}</option>
                    ))}
                </select>
                {!loading && (
                    <span style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {filtered.length} item{filtered.length !== 1 ? "s" : ""} · Total: <strong style={{ color: "var(--text-primary)" }}>{fmt(total)}</strong>
                    </span>
                )}
            </div>

            {loading ? (
                <div className="empty-state"><div className="spinner" style={{ margin: "0 auto" }} /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3>No expenses found</h3>
                    <p>Try changing the filters, or add a new expense.</p>
                </div>
            ) : (
                <div className="expense-list">
                    {filtered.map(expense => {
                        const cfg = CATEGORY_CONFIG[expense.category] || { color: "#6b7280", Icon: Package }
                        const CatIcon = cfg.Icon || Package
                        return (
                            <div key={expense.id} className="expense-item">
                                <CatIcon size={16} color={cfg.color} strokeWidth={1.7} style={{ flexShrink: 0 }} />
                                <span
                                    className="expense-cat-badge"
                                    style={{
                                        background: `${cfg.color}18`,
                                        color: cfg.color,
                                        border: `1px solid ${cfg.color}30`,
                                    }}
                                >
                                    {expense.category}
                                </span>
                                <span className="expense-note">
                                    {expense.note || <em style={{ color: "var(--text-muted)" }}>No note</em>}
                                </span>
                                <span className="expense-date">{formatDate(expense.date)}</span>
                                <span className="expense-amount">{fmt(expense.amount)}</span>
                                {confirmDeleteId === expense.id ? (
                                    <span style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Delete?</span>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDelete(expense.id)}
                                            id={`confirm-delete-${expense.id}`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => setConfirmDeleteId(null)}
                                            style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                                        >
                                            No
                                        </button>
                                    </span>
                                ) : (
                                    <button className="btn btn-danger" onClick={() => setConfirmDeleteId(expense.id)} id={`delete-${expense.id}`} title="Delete expense" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <Trash2 size={13} strokeWidth={2} />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default History
