function ExpenseForm({ name, amount, setName, setAmount, addExpense, category, setCategory }) {
    return (
        <div>
            <input value={name} placeholder="Expense name" onChange={(e) => setName(e.target.value)} />
            <input value={amount} placeholder="Amount" type="number" onChange={(e) => setAmount(e.target.value)} />
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            >
                <option value="">Select Category</option>
                <option value="Food">Food</option>
                <option value="Medical">Medical</option>
                <option value="Transport">Transport</option>
                <option value="Bills">Bills</option>
                <option value="Education">Education</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Personal">Personal</option>
                <option value="Other">Other</option>
            </select>
            <button onClick={addExpense}>Add</button>
        </div>
    )
}

export default ExpenseForm