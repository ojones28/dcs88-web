export default function ProfileUser({ transactions }) {
    return (
        <div>
            <h1>Transactions</h1>
            {transactions?.map((tx) => (
                <div key={tx.id} className="transaction">
                    <div className={`transaction-${tx.total_value > 0 ? "positive" : "negative"}`}>{tx.total_value > 0 ? "+" : "-"}<span className="aces">$</span>{Math.abs(tx.total_value)}</div>
                    <div className="transaction-type">{tx.type}</div>
                </div>
            ))}
            <h1>Achievements</h1>
        </div>
    )
}