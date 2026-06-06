import { useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, CalendarDays, Tag, Pencil, ArrowRight } from "lucide-react"
import { CATEGORY_LIST } from "../config/categories"

const STEP = 360 / CATEGORY_LIST.length
const toRad = (deg) => (deg * Math.PI) / 180
const today = new Date().toISOString().split("T")[0]

function getSelectedIdx(rotation) {
    let minDist = Infinity, sel = 0
    for (let i = 0; i < CATEGORY_LIST.length; i++) {
        const angle = (((i * STEP) + rotation) % 360 + 360) % 360
        const dist = Math.min(angle, 360 - angle)
        if (dist < minDist) { minDist = dist; sel = i }
    }
    return sel
}

function snapToNearest(rotation) {
    const idx = getSelectedIdx(rotation)
    const target = -(idx * STEP)
    const diff = ((target - rotation) % 360 + 540) % 360 - 180
    return rotation + diff
}

function AddExpense() {
    const navigate = useNavigate()
    const [amount, setAmount] = useState("")
    const [rotation, setRotation] = useState(0)
    const [date, setDate] = useState(today)
    const [note, setNote] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")
    const dragRef = useRef({ dragging: false, startX: 0, startRotation: 0 })

    const selectedIdx = getSelectedIdx(rotation)
    const selectedCat = CATEGORY_LIST[selectedIdx]
    const SelectedIcon = selectedCat.Icon
    const RADIUS = 100, CENTER = 130

    const onPointerDown = useCallback((e) => {
        dragRef.current = { dragging: true, startX: e.clientX, startRotation: rotation }
        e.currentTarget.setPointerCapture(e.pointerId)
    }, [rotation])

    const onPointerMove = useCallback((e) => {
        if (!dragRef.current.dragging) return
        setRotation(dragRef.current.startRotation + (e.clientX - dragRef.current.startX) * 0.65)
    }, [])

    const onPointerUp = useCallback(() => {
        if (!dragRef.current.dragging) return
        dragRef.current.dragging = false
        setRotation(prev => snapToNearest(prev))
    }, [])

    const handleSubmit = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError("Enter a valid amount"); return }
        setError(""); setLoading(true)
        try {
            const token = localStorage.getItem("spendly_token")
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            }
            const res = await fetch("http://localhost:3000/expenses", {
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
        <div style={{ minHeight: "calc(100vh - 68px)", display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 24px 60px" }}>
            {/* Header */}
            <div style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: 32 }}>
                <button onClick={() => navigate(-1)} style={{ position: "absolute", left: 0, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, display: "flex" }}>
                    <ChevronLeft size={20} />
                </button>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", color: "var(--text-muted)", textTransform: "uppercase" }}>New Transaction</p>
            </div>

            {/* Amount */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>Total Amount</p>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                    <span style={{ fontSize: "2rem", fontWeight: 700, color: "#22d3ee" }}>₹</span>
                    <input id="amount-input" type="number" min="1" step="0.01" placeholder="0.00" value={amount} autoFocus
                        onChange={e => { setAmount(e.target.value); setError("") }}
                        style={{ background: "none", border: "none", outline: "none", fontSize: "3.4rem", fontWeight: 800, color: "var(--text-primary)", width: "220px", textAlign: "center", fontFamily: "var(--font)", caretColor: "#22d3ee" }}
                    />
                </div>
                {error && <p style={{ fontSize: "0.78rem", color: "#ef4444", marginTop: 6 }}>⚠ {error}</p>}
            </div>

            {/* Selected badge */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 6 }}>
                <div style={{ width: 62, height: 62, borderRadius: "50%", background: `${selectedCat.color}18`, border: `2px solid ${selectedCat.color}80`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${selectedCat.color}40`, transition: "all 0.25s ease" }}>
                    <SelectedIcon size={26} color={selectedCat.color} strokeWidth={1.6} />
                </div>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", color: "#22d3ee", textTransform: "uppercase", marginTop: 8 }}>{selectedCat.label}</p>
            </div>

            {/* Dot */}
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 10px #22d3ee", marginBottom: 2 }} />

            {/* Wheel */}
            <div style={{ position: "relative", width: CENTER * 2, height: CENTER * 2, cursor: "grab", userSelect: "none", marginBottom: 20 }}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
                <svg style={{ position: "absolute", inset: 0 }} width={CENTER * 2} height={CENTER * 2}>
                    <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
                    <circle cx={CENTER} cy={CENTER} r={RADIUS - 18} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    {Array.from({ length: 24 }).map((_, i) => {
                        const a = toRad(i * 15)
                        return <line key={i} x1={CENTER + (RADIUS - 6) * Math.sin(a)} y1={CENTER - (RADIUS - 6) * Math.cos(a)} x2={CENTER + RADIUS * Math.sin(a)} y2={CENTER - RADIUS * Math.cos(a)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                    })}
                </svg>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, pointerEvents: "none" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)" }} />
                    </div>
                    <p style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>Drag to adjust</p>
                </div>
                {CATEGORY_LIST.map((cat, i) => {
                    const angleDeg = i * STEP + rotation
                    const angleRad = toRad(angleDeg)
                    const x = CENTER + RADIUS * Math.sin(angleRad)
                    const y = CENTER - RADIUS * Math.cos(angleRad)
                    const normAngle = ((angleDeg % 360) + 360) % 360
                    const distToTop = Math.min(normAngle, 360 - normAngle)
                    const proximity = Math.max(0, 1 - distToTop / 80)
                    const CatIcon = cat.Icon
                    return (
                        <div key={cat.value} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${0.65 + proximity * 0.45})`, transition: "transform 0.08s ease, opacity 0.08s ease", opacity: 0.22 + proximity * 0.78, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, pointerEvents: "none" }}>
                            <CatIcon size={20} color={i === selectedIdx ? cat.color : "rgba(255,255,255,0.5)"} strokeWidth={1.6} />
                            <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.08em", color: i === selectedIdx ? "#22d3ee" : "var(--text-muted)", textTransform: "uppercase" }}>{cat.label}</span>
                        </div>
                    )
                })}
            </div>

            {/* Date + Tag */}
            <div style={{ width: "100%", maxWidth: 400, display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                    <CalendarDays size={15} color="#22d3ee" strokeWidth={1.8} />
                    <input id="date-input" type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
                        style={{ background: "none", border: "none", outline: "none", color: "var(--text-secondary)", fontSize: "0.82rem", fontFamily: "var(--font)", colorScheme: "dark", flex: 1 }} />
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                    <Tag size={15} color="#22d3ee" strokeWidth={1.8} />
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>{selectedCat.label}</span>
                </div>
            </div>

            {/* Note */}
            <div style={{ width: "100%", maxWidth: 400, display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginBottom: 32 }}>
                <Pencil size={14} color="var(--text-muted)" strokeWidth={1.8} />
                <input id="note-input" type="text" placeholder="Add a note..." value={note} onChange={e => setNote(e.target.value)}
                    style={{ background: "none", border: "none", outline: "none", color: "var(--text-secondary)", fontSize: "0.85rem", fontFamily: "var(--font)", flex: 1 }} />
            </div>

            {/* Submit */}
            <button id="submit-expense" onClick={handleSubmit} disabled={loading || success}
                style={{ width: "100%", maxWidth: 400, padding: "16px 32px", background: success ? "#22c55e" : "linear-gradient(135deg, #0891b2, #22d3ee)", border: "none", borderRadius: 50, color: "#000", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: loading || success ? "not-allowed" : "pointer", boxShadow: "0 4px 28px rgba(34,211,238,0.3)", transition: "all 0.2s ease", fontFamily: "var(--font)", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {success ? "Saved!" : loading ? "Saving…" : <><span>Confirm Entry</span><ArrowRight size={16} strokeWidth={2.5} /></>}
            </button>
        </div>
    )
}

export default AddExpense
