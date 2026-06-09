import { useState } from "react"
import Button from "../../components/Button"
import Modal from "../../components/Modal"

export default function ProfileUser({ transactions, achievements }) {
    console.log(achievements)
    return (
        <div className="profile">
            <div className="profile-left">
                <div className="profile-section">
                    <h1>Stats</h1>
                    <div className="stats">
                        <div>
                            
                        </div>
                    </div>
                </div>
            </div>
            <div className="profile-right">
                <div className="profile-section">
                    <h1>Achievements</h1>
                    <div className="achievements">
                        {achievements?.map((a) => (
                            <div key={a.id} className={`achievement${a.unlocked_at ? " unlocked" : " locked"}`}>
                                <div className="achievement-name">{a.name}</div>
                                <div className="achievement-description">{a.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="profile-section">
                    <h1>Transactions</h1>
                    <div className="transactions">
                        {transactions?.map((tx) => (
                            <div key={tx.id} className="transaction">
                                <div className={`transaction-${tx.total_value > 0 ? "positive" : "negative"}`}>{tx.total_value > 0 ? "+" : "-"}<span className="aces">$</span>{Math.abs(tx.total_value).toLocaleString()}</div>
                                <div className="transaction-type"> {tx.type}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}