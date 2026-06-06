import { createContext, useContext, useState, useCallback } from "react"

const AuthContext = createContext(null)

const API = "http://localhost:3000"

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem("spendly_user")
            return saved ? JSON.parse(saved) : null
        } catch { return null }
    })

    const [token, setToken] = useState(() => localStorage.getItem("spendly_token") || null)

    const login = useCallback(async (email, password) => {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Login failed")
        localStorage.setItem("spendly_token", data.token)
        localStorage.setItem("spendly_user", JSON.stringify(data.user))
        setToken(data.token)
        setUser(data.user)
        return data
    }, [])

    const signup = useCallback(async (name, email, password) => {
        const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Registration failed")
        localStorage.setItem("spendly_token", data.token)
        localStorage.setItem("spendly_user", JSON.stringify(data.user))
        setToken(data.token)
        setUser(data.user)
        return data
    }, [])

    const logout = useCallback(() => {
        localStorage.removeItem("spendly_token")
        localStorage.removeItem("spendly_user")
        setToken(null)
        setUser(null)
    }, [])

    const updateProfile = useCallback(async (updates) => {
        const res = await fetch(`${API}/auth/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Update failed")
        localStorage.setItem("spendly_user", JSON.stringify(data.user))
        setUser(data.user)
        return data
    }, [token])

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, updateProfile, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used within AuthProvider")
    return ctx
}
