function ExpenseList({ expenses, onDelete }) {
    return (
        <div>
            <ul>
                {expenses.map((expense, index) => (
                    <li key={index}>
                        {expense.name} - ₹{expense.amount} - {new Date(expense.date).toLocaleString()}
                        <button onClick={() => onDelete(expense.id)}>Delete</button>
                    </li>
                ))}
            </ul>

            <h3>Total: ₹{expenses.reduce((total, expense) => total + Number(expense.amount), 0)}</h3>
        </div>

    )
}

export default ExpenseList