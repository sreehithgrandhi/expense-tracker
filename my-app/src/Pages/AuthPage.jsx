import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Wallet, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react"

function AuthPage() {
    const [mode, setMode] = useState("login") // "login" | "signup"
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()
    const { login, signup } = useAuth()

    const isLogin = mode === "login"

    const switchMode = () => {
        setMode(isLogin ? "signup" : "login")
        setError("")
        setName("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
    }

    const validate = () => {
        if (!email.trim()) return "Email is required"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email"
        if (!password) return "Password is required"
        if (password.length < 6) return "Password must be at least 6 characters"
        if (!isLogin) {
            if (!name.trim()) return "Name is required"
            if (password !== confirmPassword) return "Passwords do not match"
        }
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const validationError = validate()
        if (validationError) { setError(validationError); return }

        setError("")
        setLoading(true)
        try {
            if (isLogin) {
                await login(email, password)
            } else {
                await signup(name, email, password)
            }
            navigate("/", { replace: true })
        } catch (err) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            {/* Ambient background effects */}
            <div className="auth-bg-glow auth-bg-glow-1" />
            <div className="auth-bg-glow auth-bg-glow-2" />
            <div className="auth-bg-grid" />

            <div className="auth-container">
                {/* Brand */}
                <div className="auth-brand">
                    <div className="auth-brand-icon">
                        <Wallet size={24} strokeWidth={2} />
                    </div>
                    <h1 className="auth-brand-name">Spendly</h1>
                    <p className="auth-brand-tagline">
                        {isLogin
                            ? "Welcome back. Your finances await."
                            : "Take control of your spending journey."
                        }
                    </p>
                </div>

                {/* Card */}
                <div className="auth-card">
                    {/* Tabs */}
                    <div className="auth-tabs">
                        <button
                            className={`auth-tab${isLogin ? " active" : ""}`}
                            onClick={() => switchMode()}
                            type="button"
                        >
                            Sign In
                        </button>
                        <button
                            className={`auth-tab${!isLogin ? " active" : ""}`}
                            onClick={() => switchMode()}
                            type="button"
                        >
                            Create Account
                        </button>
                        <div
                            className="auth-tab-indicator"
                            style={{ transform: `translateX(${isLogin ? "0%" : "100%"})` }}
                        />
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
                        {/* Error Banner */}
                        {error && (
                            <div className="auth-error">
                                <span className="auth-error-icon">⚠</span>
                                {error}
                            </div>
                        )}

                        {/* Name field (signup only) */}
                        <div className={`auth-field-wrapper${!isLogin ? " visible" : ""}`}>
                            {!isLogin && (
                                <div className="auth-field">
                                    <label htmlFor="auth-name" className="auth-label">Full Name</label>
                                    <div className="auth-input-wrapper">
                                        <User size={16} className="auth-input-icon" />
                                        <input
                                            id="auth-name"
                                            type="text"
                                            className="auth-input"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            autoComplete="name"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="auth-field">
                            <label htmlFor="auth-email" className="auth-label">Email Address</label>
                            <div className="auth-input-wrapper">
                                <Mail size={16} className="auth-input-icon" />
                                <input
                                    id="auth-email"
                                    type="email"
                                    className="auth-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError("") }}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="auth-field">
                            <label htmlFor="auth-password" className="auth-label">Password</label>
                            <div className="auth-input-wrapper">
                                <Lock size={16} className="auth-input-icon" />
                                <input
                                    id="auth-password"
                                    type={showPassword ? "text" : "password"}
                                    className="auth-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError("") }}
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                />
                                <button
                                    type="button"
                                    className="auth-toggle-password"
                                    onClick={() => setShowPassword(v => !v)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password (signup only) */}
                        <div className={`auth-field-wrapper${!isLogin ? " visible" : ""}`}>
                            {!isLogin && (
                                <div className="auth-field">
                                    <label htmlFor="auth-confirm-password" className="auth-label">Confirm Password</label>
                                    <div className="auth-input-wrapper">
                                        <Lock size={16} className="auth-input-icon" />
                                        <input
                                            id="auth-confirm-password"
                                            type={showPassword ? "text" : "password"}
                                            className="auth-input"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={e => { setConfirmPassword(e.target.value); setError("") }}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Forgot Password link (login only) */}
                        {isLogin && (
                            <div className="auth-forgot-row">
                                <button type="button" className="auth-forgot-link" tabIndex={-1}>
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            id="auth-submit"
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="spinner" />
                            ) : (
                                <>
                                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                                    <ArrowRight size={16} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>


                    {/* Footer toggle */}
                    <p className="auth-footer">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button type="button" className="auth-switch-link" onClick={switchMode}>
                            {isLogin ? "Sign up" : "Sign in"}
                        </button>
                    </p>
                </div>

                {/* Trust indicators */}
                <div className="auth-trust">
                    <span>🔒 256-bit encryption</span>
                    <span>·</span>
                    <span>Your data stays yours</span>
                </div>
            </div>
        </div>
    )
}

export default AuthPage
