import { NavLink } from "react-router-dom"
import { LayoutDashboard, PlusCircle, List, CalendarDays, Wallet, Settings } from "lucide-react"
import { useAuth } from "../context/AuthContext"

const navItems = [
    { to: "/",        label: "Dashboard",   Icon: LayoutDashboard },
    { to: "/add",     label: "Add Expense", Icon: PlusCircle },
    { to: "/history", label: "History",     Icon: List },
    { to: "/heatmap", label: "Heatmap",     Icon: CalendarDays },
]

function Navbar() {
    const { user, isAuthenticated } = useAuth()

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

            {navItems.map(({ to, label, Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                >
                    <Icon size={15} strokeWidth={1.8} />
                    {label}
                </NavLink>
            ))}

            {/* User avatar / settings */}
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
