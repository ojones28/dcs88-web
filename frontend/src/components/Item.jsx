import { useEffect, useState } from "react"

export default function Item({ item, owned, cart, changeQuantity }) {
    const quantity = Number(cart.find(i => i.id === item.id)?.quantity) || 0

    const [inputValue, setInputValue] = useState(String(quantity))
    useEffect(() => {
        setInputValue(String(quantity))
    }, [quantity])

    return (
        <div className="item">
            <div className="quantity-control">
                <button className="button quantity-change" onClick={() => {
                    changeQuantity(item.id, quantity + 1, item.default_cost)
                }}>+</button>
                <input
                    className="quantity-value text-input"
                    type="number"
                    value={inputValue}
                    onChange={(e) => {
                        changeQuantity(item.id, Math.max(Number(e.target.value), 0), item.default_cost)
                    }}
                    min={0}
                />
                <button className="button quantity-change" onClick={() => {
                    changeQuantity(item.id, Math.max(quantity - 1, 0), item.default_cost)
                }}>-</button>
            </div>
            <img className="item-img" src="../src/assets/images/items/AGM62I.gif"/>
            <div className="item-desc">
                <h2 className="item-name" title={item.long_name}>{item.long_name}</h2>
                <div className="item-price"><span className="aces">$</span>{item.default_cost.toLocaleString()}</div>
                <div className="item-amount">{item.quantity ?? 0} LEFT | {owned ?? 0} OWNED</div>
            </div>
        </div>
    )
}