// Mock Backend Interceptor for Standalone Frontend Testing
// Intercepts all requests to http://localhost:3000 and simulates the database in localStorage.

const originalFetch = window.fetch;

// Initialize mock DB in localStorage
if (!localStorage.getItem("mock_users")) {
    localStorage.setItem("mock_users", JSON.stringify([
        { name: "Demo User", email: "demo@spendly.com", password: "password123" }
    ]));
}

// Force re-seed if categories were fixed (v2)
const SEED_VERSION = "v2";
if (localStorage.getItem("mock_seed_version") !== SEED_VERSION) {
    localStorage.removeItem("mock_expenses");
    localStorage.setItem("mock_seed_version", SEED_VERSION);
}

if (!localStorage.getItem("mock_expenses")) {
    const seedExpenses = [];
    const categories = ["Food", "Transport", "Medical", "Entertainment", "Groceries", "Other"];
    const now = new Date();
    // seed last 30 days
    for (let i = 0; i < 25; i++) {
        const d = new Date();
        d.setDate(now.getDate() - Math.floor(Math.random() * 25));
        seedExpenses.push({
            id: 1000 + i,
            user_email: "demo@spendly.com",
            amount: Math.floor(Math.random() * 1200) + 150,
            category: categories[Math.floor(Math.random() * categories.length)],
            date: d.toISOString().split("T")[0],
            note: "Mock transaction " + (i + 1)
        });
    }
    localStorage.setItem("mock_expenses", JSON.stringify(seedExpenses));
}

window.fetch = async function (url, options) {
    if (typeof url === "string" && url.startsWith("http://localhost:3000")) {
        const parsedUrl = new URL(url);
        const path = parsedUrl.pathname;
        const method = options?.method || "GET";
        const body = options?.body ? JSON.parse(options.body) : null;
        const authHeader = options?.headers?.Authorization || options?.headers?.authorization;
        let currentUserEmail = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            currentUserEmail = authHeader.replace("Bearer ", "");
        } else {
            try {
                const savedUser = JSON.parse(localStorage.getItem("spendly_user"));
                currentUserEmail = savedUser?.email;
            } catch { }
        }

        // Add a slight realistic network delay (300ms)
        await new Promise(r => setTimeout(r, 300));

        let users = JSON.parse(localStorage.getItem("mock_users") || "[]");
        let expenses = JSON.parse(localStorage.getItem("mock_expenses") || "[]");

        // --- AUTH ROUTES ---
        if (path === "/auth/register" && method === "POST") {
            const { name, email, password } = body;
            if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
                return new Response(JSON.stringify({ error: "Email already registered" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                });
            }
            const newUser = { name, email, password };
            users.push(newUser);
            localStorage.setItem("mock_users", JSON.stringify(users));
            return new Response(JSON.stringify({
                token: email,
                user: { name, email }
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (path === "/auth/login" && method === "POST") {
            const { email, password } = body;
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            if (!user) {
                // If login fails, let's auto-register them to make testing super frictionless!
                const name = email.split("@")[0];
                const newUser = { name, email, password };
                users.push(newUser);
                localStorage.setItem("mock_users", JSON.stringify(users));
                return new Response(JSON.stringify({
                    token: email,
                    user: { name, email }
                }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                });
            }
            return new Response(JSON.stringify({
                token: user.email,
                user: { name: user.name, email: user.email }
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (path === "/auth/profile" && method === "PUT") {
            if (!currentUserEmail) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }
            const userIdx = users.findIndex(u => u.email.toLowerCase() === currentUserEmail.toLowerCase());
            if (userIdx === -1) {
                return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
            }

            if (body.name) {
                users[userIdx].name = body.name;
            }
            if (body.currentPassword && body.newPassword) {
                if (users[userIdx].password !== body.currentPassword) {
                    return new Response(JSON.stringify({ error: "Incorrect current password" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json" }
                    });
                }
                users[userIdx].password = body.newPassword;
            }
            localStorage.setItem("mock_users", JSON.stringify(users));
            return new Response(JSON.stringify({
                user: { name: users[userIdx].name, email: users[userIdx].email }
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        // --- EXPENSES ROUTES (Scoped to currentUserEmail) ---
        if (!currentUserEmail) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const userExpenses = expenses.filter(e => e.user_email.toLowerCase() === currentUserEmail.toLowerCase());

        if (path === "/expenses" && method === "GET") {
            let result = [...userExpenses];
            const month = parsedUrl.searchParams.get("month");
            const year = parsedUrl.searchParams.get("year");
            if (month && year) {
                result = result.filter(e => {
                    const d = new Date(e.date);
                    return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);
                });
            }
            result.sort((a, b) => new Date(b.date) - new Date(a.date));
            return new Response(JSON.stringify(result), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (path === "/expenses" && method === "POST") {
            const { amount, category, date, note } = body;
            const newExpense = {
                id: Date.now(),
                user_email: currentUserEmail,
                amount: Number(amount),
                category,
                date: date || new Date().toISOString().split("T")[0],
                note: note || ""
            };
            expenses.push(newExpense);
            localStorage.setItem("mock_expenses", JSON.stringify(expenses));
            return new Response(JSON.stringify({ message: "Expense added", expense: newExpense }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (path.startsWith("/expenses/") && method === "DELETE") {
            const id = Number(path.split("/").pop());
            expenses = expenses.filter(e => !(e.id === id && e.user_email.toLowerCase() === currentUserEmail.toLowerCase()));
            localStorage.setItem("mock_expenses", JSON.stringify(expenses));
            return new Response(JSON.stringify({ message: `Expense ${id} deleted` }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (path === "/expenses/by-category" && method === "GET") {
            let source = [...userExpenses];
            const month = parsedUrl.searchParams.get("month");
            const year = parsedUrl.searchParams.get("year");
            if (month && year) {
                source = source.filter(e => {
                    const d = new Date(e.date);
                    return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);
                });
            }
            const grouped = {};
            source.forEach(e => {
                if (!grouped[e.category]) {
                    grouped[e.category] = { category: e.category, total: 0, count: 0 };
                }
                grouped[e.category].total += Number(e.amount);
                grouped[e.category].count++;
            });
            return new Response(JSON.stringify(Object.values(grouped)), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (path === "/expenses/by-date" && method === "GET") {
            let source = [...userExpenses];
            const month = parsedUrl.searchParams.get("month");
            const year = parsedUrl.searchParams.get("year");
            if (month && year) {
                source = source.filter(e => {
                    const d = new Date(e.date);
                    return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);
                });
            }
            const grouped = {};
            source.forEach(e => {
                const dateKey = new Date(e.date).toISOString().split("T")[0];
                if (!grouped[dateKey]) {
                    grouped[dateKey] = { date: dateKey, total: 0, count: 0, expenses: [] };
                }
                grouped[dateKey].total += Number(e.amount);
                grouped[dateKey].count++;
                grouped[dateKey].expenses.push(e);
            });
            return new Response(JSON.stringify(Object.values(grouped)), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        if (path === "/expenses/months" && method === "GET") {
            const seen = new Set();
            const months = [];
            userExpenses.forEach(e => {
                const d = new Date(e.date);
                const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
                }
            });
            months.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
            return new Response(JSON.stringify(months), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }
    }
    return originalFetch(url, options);
};
