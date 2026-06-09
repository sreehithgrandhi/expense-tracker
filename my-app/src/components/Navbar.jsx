import { NavLink } from "react-router-dom"
import { LayoutDashboard, PlusCircle, List, CalendarDays, Wallet, Settings, Sun, Moon } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"

const navItems = [
    { to: "/", label: "Dashboard", Icon: LayoutDashboard },
    { to: "/add", label: "Add", Icon: PlusCircle },
    { to: "/history", label: "History", Icon: List },
    { to: "/heatmap", label: "Heatmap", Icon: CalendarDays },
]

function Navbar() {
    const { user, isAuthenticated } = useAuth()
    const { theme, toggleTheme } = useTheme()

    if (!isAuthenticated) return null

    const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?"

    return (
        <nav className="navbar">
            <NavLink to="/" className="navbar-brand">
                <div className="navbar-brand-icon">
                    <Wallet size={18} strokeWidth={2} />
                </div>
                <span>Spendly</span>
            </NavLink>

            <div className="nav-links">
                {navItems.map(({ to, label, Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === "/"}
                        className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                    >
                        <Icon size={15} strokeWidth={1.8} />
                        <span className="nav-link-label">{label}</span>
                    </NavLink>
                ))}

                {/* Settings link in bottom bar on mobile */}
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `nav-link nav-link-settings-mobile${isActive ? " active" : ""}`}
                >
                    <Settings size={15} strokeWidth={1.8} />
                    <span className="nav-link-label">Settings</span>
                </NavLink>
            </div>

            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className="theme-toggle-btn"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
                {theme === "dark" ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
            </button>

            {/* User avatar / settings (desktop only) */}
            <NavLink
                to="/settings"
                className={({ isActive }) => `nav-user-btn${isActive ? " active" : ""}`}
                title="Account Settings"
            >
                <div className="nav-avatar">
                    {initial}
                </div>
            </NavLink>
        </nav>
    )
}

export default Navbar

