import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import Navbar from "./components/Navbar"
import ProtectedRoute from "./components/ProtectedRoute"
import AuthPage from "./Pages/AuthPage"
import Dashboard from "./Pages/Dashboard"
import AddExpense from "./Pages/AddExpense"
import History from "./Pages/History"
import Heatmap from "./Pages/Heatmap"
import Settings from "./Pages/Settings"
import "./index.css"

function AppRoutes() {
    const { isAuthenticated } = useAuth()

    return (
        <>
            <Navbar />
            <Routes>
                {/* Auth route — redirect to dashboard if already logged in */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />}
                />

                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/add" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/heatmap" element={<ProtectedRoute><Heatmap /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    )
}

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    )
}

export default App