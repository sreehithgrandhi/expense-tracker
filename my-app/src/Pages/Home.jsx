import ExpenseForm from "../components/ExpenseForm"
import ExpenseList from "../components/ExpenseList"

function Home({ expenses, name, amount, setName, setAmount, addExpense, onDelete, setCategory, category }) {
    return (
        <div>
            <ExpenseForm name={name} amount={amount} setName={setName} setAmount={setAmount} addExpense={addExpense} setCategory={setCategory} category={category} />
            <ExpenseList expenses={expenses} onDelete={onDelete} />
        </div>
    )
}

export default Home
