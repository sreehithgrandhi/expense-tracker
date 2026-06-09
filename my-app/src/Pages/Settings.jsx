import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { User, Mail, Lock, LogOut, ChevronLeft, Check, Shield, Bell, Palette } from "lucide-react"

function Settings() {
    const { user, logout, updateProfile } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const [name, setName] = useState(user?.name || "")
    const [email, setEmail] = useState(user?.email || "")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState("")
    const [error, setError] = useState("")

    const handleSaveProfile = async () => {
        if (!name.trim()) { setError("Name is required"); return }
        setError(""); setLoading(true); setSuccess("")
        try {
            await updateProfile({ name })
            setSuccess("Profile updated successfully")
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) { setError("Fill in both password fields"); return }
        if (newPassword.length < 6) { setError("New password must be at least 6 characters"); return }
        setError(""); setLoading(true); setSuccess("")
        try {
            await updateProfile({ currentPassword, newPassword })
            setSuccess("Password changed successfully")
            setCurrentPassword("")
            setNewPassword("")
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate("/login", { replace: true })
    }

    const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?"

    return (
        <div className="page-container" style={{ maxWidth: 640, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, display: "flex" }}
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", color: "#22d3ee", textTransform: "uppercase", marginBottom: 4 }}>
                        Account
                    </p>
                    <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800 }}>Settings</h1>
                </div>
            </div>

            {/* Avatar + Info */}
            <div className="card" style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
                <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "linear-gradient(135deg, #0891b2, #22d3ee)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.6rem", fontWeight: 800, color: "#000",
                    boxShadow: "0 0 30px rgba(34,211,238,0.25)",
                    flexShrink: 0,
                }}>
                    {initial}
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: 2 }}>{user?.name || "User"}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{user?.email || ""}</p>
                </div>
            </div>

            {/* Success / Error */}
            {success && (
                <div className="success-banner" style={{ marginBottom: 20 }}>
                    <Check size={16} /> {success}
                </div>
            )}
            {error && (
                <div style={{
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "var(--radius-sm)", padding: "12px 16px", color: "#ef4444",
                    fontSize: "0.85rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
                }}>
                    ⚠ {error}
                </div>
            )}

            {/* Profile Section */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                    <User size={16} color="#22d3ee" strokeWidth={1.8} />
                    <p className="section-title" style={{ margin: 0 }}>Profile Information</p>
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="settings-name">Display Name</label>
                    <input
                        id="settings-name"
                        type="text"
                        className="form-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your name"
                    />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="settings-email">Email</label>
                    <input
                        id="settings-email"
                        type="email"
                        className="form-input"
                        value={email}
                        disabled
                        style={{ opacity: 0.5, cursor: "not-allowed" }}
                    />
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 6 }}>
                        Email cannot be changed
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleSaveProfile}
                    disabled={loading}
                    style={{ marginTop: 16 }}
                >
                    {loading ? <div className="spinner" /> : "Save Changes"}
                </button>
            </div>

            {/* Security Section */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                    <Shield size={16} color="#22d3ee" strokeWidth={1.8} />
                    <p className="section-title" style={{ margin: 0 }}>Security</p>
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="settings-current-pw">Current Password</label>
                    <input
                        id="settings-current-pw"
                        type="password"
                        className="form-input"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                    />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="settings-new-pw">New Password</label>
                    <input
                        id="settings-new-pw"
                        type="password"
                        className="form-input"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                    />
                </div>
                <button
                    className="btn btn-ghost"
                    onClick={handleChangePassword}
                    disabled={loading}
                    style={{ marginTop: 16 }}
                >
                    Change Password
                </button>
            </div>

            {/* Preferences Section */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                    <Palette size={16} color="#22d3ee" strokeWidth={1.8} />
                    <p className="section-title" style={{ margin: 0 }}>Preferences</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Bell size={15} color="var(--text-muted)" strokeWidth={1.7} />
                        <div>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Notifications</p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Budget alerts & reminders</p>
                        </div>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>Coming soon</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Palette size={15} color="var(--text-muted)" strokeWidth={1.7} />
                        <div>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Theme</p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{theme === "dark" ? "Dark mode active" : "Light mode active"}</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="btn btn-ghost"
                        id="theme-toggle-btn-settings"
                        style={{
                            padding: "6px 14px",
                            fontSize: "0.78rem",
                            borderRadius: 100,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontWeight: 700,
                        }}
                    >
                        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ borderColor: "rgba(239,68,68,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <LogOut size={16} color="#ef4444" strokeWidth={1.8} />
                    <p className="section-title" style={{ margin: 0, color: "#ef4444" }}>Danger Zone</p>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16 }}>
                    Logging out will clear your session on this device.
                </p>
                <button
                    id="logout-btn"
                    className="btn btn-danger"
                    onClick={handleLogout}
                    style={{ padding: "10px 20px", fontSize: "0.85rem" }}
                >
                    <LogOut size={14} strokeWidth={2} /> Sign Out
                </button>
            </div>
        </div>
    )
}

export default Settings
