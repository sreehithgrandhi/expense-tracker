import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, CalendarDays, Tag, Pencil, ArrowRight } from "lucide-react"
import { CATEGORY_LIST } from "../config/categories"

const today = new Date().toISOString().split("T")[0]

function AddExpense() {
    const navigate = useNavigate()
    const [amount, setAmount] = useState("")
    const [category, setCategory] = useState("Food")
    const [date, setDate] = useState(today)
    const [note, setNote] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")

    const selectedCat = CATEGORY_LIST.find(c => c.value === category) || CATEGORY_LIST[0]
    const SelectedIcon = selectedCat.Icon

    const handleSubmit = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError("Enter a valid amount"); return }
        setError(""); setLoading(true)
        try {
            const token = localStorage.getItem("spendly_token")
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            }
            const res = await fetch("https://expense-backend-qh3n.onrender.com/expenses", {
                method: "POST",
                headers,
                body: JSON.stringify({ amount: Number(amount), category: selectedCat.value, date, note }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Save failed")
            }
            setSuccess(true)
            setTimeout(() => navigate("/"), 1200)
        } catch (err) {
            setError(err.message || "Could not save. Is the backend running?")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="add-expense-page">
            {/* Header */}
            <div className="add-expense-header">
                <button onClick={() => navigate(-1)} className="add-expense-back">
                    <ChevronLeft size={20} />
                </button>
                <p className="add-expense-title">New Transaction</p>
            </div>

            {/* Amount */}
            <div className="add-expense-amount-section">
                <p className="add-expense-label">Total Amount</p>
                <div className="add-expense-amount-row">
                    <span className="add-expense-currency">₹</span>
                    <input id="amount-input" type="number" min="1" step="0.01" placeholder="0.00" value={amount} autoFocus
                        onChange={e => { setAmount(e.target.value); setError("") }}
                        className="add-expense-amount-input"
                    />
                </div>
                {error && <p className="add-expense-error">⚠ {error}</p>}
            </div>

            {/* Selected category preview badge */}
            <div className="add-expense-badge" style={{ marginBottom: 20 }}>
                <div className="add-expense-badge-circle" style={{ background: `${selectedCat.color}18`, borderColor: `${selectedCat.color}80`, boxShadow: `0 0 24px ${selectedCat.color}40` }}>
                    <SelectedIcon size={26} color={selectedCat.color} strokeWidth={1.6} />
                </div>
                <p className="add-expense-badge-label">{selectedCat.label}</p>
            </div>

            {/* Fields Form */}
            <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {/* Category Selector */}
                <div className="add-expense-meta-field">
                    <Tag size={15} color="#22d3ee" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, position: "relative" }}>
                        <select
                            id="category-select"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            style={{
                                background: "none",
                                border: "none",
                                outline: "none",
                                color: "var(--text-secondary)",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                width: "100%",
                                cursor: "pointer",
                                appearance: "none",
                                WebkitAppearance: "none",
                                paddingRight: "20px"
                            }}
                        >
                            {CATEGORY_LIST.map(cat => (
                                <option key={cat.value} value={cat.value} style={{ background: "#111218", color: "var(--text-primary)" }}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                        <div style={{
                            position: "absolute",
                            right: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "var(--text-muted)",
                            fontSize: "0.7rem"
                        }}>
                            ▼
                        </div>
                    </div>
                </div>

                {/* Date */}
                <div className="add-expense-meta-field">
                    <CalendarDays size={15} color="#22d3ee" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    <input id="date-input" type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
                        className="add-expense-date-input" />
                </div>

                {/* Note */}
                <div className="add-expense-meta-field">
                    <Pencil size={14} color="var(--text-muted)" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    <input id="note-input" type="text" placeholder="Add a note..." value={note} onChange={e => setNote(e.target.value)}
                        className="add-expense-note-input" />
                </div>
            </div>

            {/* Submit */}
            <button id="submit-expense" onClick={handleSubmit} disabled={loading || success}
                className={`add-expense-submit${success ? " success" : ""}`}>
                {success ? "Saved!" : loading ? "Saving…" : <><span>Confirm Entry</span><ArrowRight size={16} strokeWidth={2.5} /></>}
            </button>
        </div>
    )
}

export default AddExpense
