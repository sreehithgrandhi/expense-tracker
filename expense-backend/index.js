require("dotenv").config()
const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("./models/User")
const Expense = require("./models/Expense")
const authenticateToken = require("./middleware/auth")

const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000
const MONGO_URI = process.env.MONGO_URI
const JWT_SECRET = process.env.JWT_SECRET

if (!MONGO_URI || !JWT_SECRET) {
    console.error("Missing required environment variables. Check your .env file.")
    console.error("Required: MONGO_URI, JWT_SECRET")
    process.exit(1)
}

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => {
        console.error("MongoDB connection error:", err)
        process.exit(1)
    })

// Helper to format expense response
const formatExpense = (exp) => {
    if (!exp) return null
    return {
        id: exp._id.toString(),
        amount: exp.amount,
        category: exp.category,
        date: exp.date,
        note: exp.note || "",
        createdAt: exp.createdAt
    }
}

// --- Auth Routes ---

// Register
app.post("/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" })
        }

        const normalizedEmail = email.toLowerCase().trim()
        const existingUser = await User.findOne({ email: normalizedEmail })
        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword
        })

        await user.save()

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })
        res.status(201).json({
            token,
            user: { name: user.name, email: user.email }
        })
    } catch (err) {
        console.error("Register error:", err)
        res.status(500).json({ error: "Server error during registration" })
    }
})

// Login
app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" })
        }

        const normalizedEmail = email.toLowerCase().trim()
        const user = await User.findOne({ email: normalizedEmail })
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" })
        }

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })
        res.json({
            token,
            user: { name: user.name, email: user.email }
        })
    } catch (err) {
        console.error("Login error:", err)
        res.status(500).json({ error: "Server error during login" })
    }
})

// Update Profile
app.put("/auth/profile", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        const { name, currentPassword, newPassword } = req.body

        if (name) {
            user.name = name
        }

        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password)
            if (!isMatch) {
                return res.status(400).json({ error: "Incorrect current password" })
            }
            user.password = await bcrypt.hash(newPassword, 10)
        }

        await user.save()
        res.json({
            user: { name: user.name, email: user.email }
        })
    } catch (err) {
        console.error("Profile update error:", err)
        res.status(500).json({ error: "Server error during profile update" })
    }
})

// --- Expense Routes (All Protected) ---

// GET all expenses (filtered by month/year)
app.get("/expenses", authenticateToken, async (req, res) => {
    try {
        const { month, year } = req.query
        const filter = { userId: req.user.id }

        if (month && year) {
            const m = Number(month)
            const y = Number(year)
            const startDate = new Date(y, m - 1, 1)
            const endDate = new Date(y, m, 0, 23, 59, 59, 999)
            filter.date = { $gte: startDate, $lte: endDate }
        }

        const list = await Expense.find(filter).sort({ date: -1 })
        res.json(list.map(formatExpense))
    } catch (err) {
        console.error("GET /expenses error:", err)
        res.status(500).json({ error: "Server error fetching expenses" })
    }
})

// GET expenses grouped by category
app.get("/expenses/by-category", authenticateToken, async (req, res) => {
    try {
        const { month, year } = req.query
        const filter = { userId: req.user.id }

        if (month && year) {
            const m = Number(month)
            const y = Number(year)
            const startDate = new Date(y, m - 1, 1)
            const endDate = new Date(y, m, 0, 23, 59, 59, 999)
            filter.date = { $gte: startDate, $lte: endDate }
        }

        const list = await Expense.find(filter)
        const grouped = {}
        list.forEach(e => {
            if (!grouped[e.category]) {
                grouped[e.category] = { category: e.category, total: 0, count: 0 }
            }
            grouped[e.category].total += Number(e.amount)
            grouped[e.category].count++
        })

        res.json(Object.values(grouped))
    } catch (err) {
        console.error("GET /expenses/by-category error:", err)
        res.status(500).json({ error: "Server error fetching expenses by category" })
    }
})

// GET expenses grouped by date
app.get("/expenses/by-date", authenticateToken, async (req, res) => {
    try {
        const { month, year } = req.query
        const filter = { userId: req.user.id }

        if (month && year) {
            const m = Number(month)
            const y = Number(year)
            const startDate = new Date(y, m - 1, 1)
            const endDate = new Date(y, m, 0, 23, 59, 59, 999)
            filter.date = { $gte: startDate, $lte: endDate }
        }

        const list = await Expense.find(filter).sort({ date: -1 })
        const grouped = {}
        list.forEach(e => {
            const dateKey = new Date(e.date).toISOString().split("T")[0]
            if (!grouped[dateKey]) {
                grouped[dateKey] = { date: dateKey, total: 0, count: 0, expenses: [] }
            }
            grouped[dateKey].total += Number(e.amount)
            grouped[dateKey].count++
            grouped[dateKey].expenses.push(formatExpense(e))
        })

        res.json(Object.values(grouped))
    } catch (err) {
        console.error("GET /expenses/by-date error:", err)
        res.status(500).json({ error: "Server error fetching expenses by date" })
    }
})

// GET distinct months that have at least one expense
app.get("/expenses/months", authenticateToken, async (req, res) => {
    try {
        const list = await Expense.find({ userId: req.user.id })
        const seen = new Set()
        const months = []

        list.forEach(e => {
            const d = new Date(e.date)
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`
            if (!seen.has(key)) {
                seen.add(key)
                months.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
            }
        })

        // Sort chronologically
        months.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
        res.json(months)
    } catch (err) {
        console.error("GET /expenses/months error:", err)
        res.status(500).json({ error: "Server error fetching available months" })
    }
})

// POST add expense
app.post("/expenses", authenticateToken, async (req, res) => {
    try {
        const { amount, category, date, note } = req.body
        if (!amount || !category) {
            return res.status(400).json({ error: "Amount and category are required" })
        }

        const newExpense = new Expense({
            userId: req.user.id,
            amount: Number(amount),
            category,
            date: date ? new Date(date) : new Date(),
            note: note || ""
        })

        await newExpense.save()
        res.status(201).json({ message: "Expense added", expense: formatExpense(newExpense) })
    } catch (err) {
        console.error("POST /expenses error:", err)
        res.status(500).json({ error: "Server error adding expense" })
    }
})

// DELETE expense
app.delete("/expenses/:id", authenticateToken, async (req, res) => {
    try {
        const result = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
        if (!result) {
            return res.status(404).json({ error: "Expense not found or unauthorized" })
        }
        res.json({ message: `Expense ${req.params.id} deleted` })
    } catch (err) {
        console.error("DELETE /expenses/:id error:", err)
        res.status(500).json({ error: "Server error deleting expense" })
    }
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})