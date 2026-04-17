import '../../assets/styles/shop.css'
import { useEffect, useMemo, useState } from "react"
import Item from "../../components/Item"
import Button from '../../components/Button'
import { useLoaderData, useNavigate, useOutletContext } from 'react-router'

export async function loader() {
    const [itemsRes, userItemsRes] = await Promise.all([
        fetch('/api/items', { credentials: 'include' }),
        fetch('/api/user-items', { credentials: 'include' })
    ])

    if (!itemsRes.ok) {
        throw new Response("Failed to load items", { status: itemsRes.status })
    }

    const items = await itemsRes.json()
    const userItems = userItemsRes.ok ? await userItemsRes.json() : []

    return { items, userItems }
}

export default function Cart() {
    const { items, userItems } = useLoaderData()
    const [cart, setCart] = useState(() =>
        JSON.parse(localStorage.getItem("cart") || "[]")
    )
    const [modal, setModal] = useState({
        open: false,
        success: false,
        error: "",
        total: 0,
        items: 0
    })

    const { loadUser } = useOutletContext()

    const navigate = useNavigate()

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart))
    }, [cart])

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, entry) => sum + entry.price * entry.quantity, 0)
    }, [cart])

    const ownedMap = useMemo(() => {
        const owned = {}
        for (const item of userItems) {
            owned[item.item_id] = item.quantity
        }
        return owned
    }, [userItems])

    function changeQuantity(itemId, quantity, price) {
        setCart(prev => {
            if (quantity == 0) {
                return prev.filter(i => i.id !== itemId)
            }

            const existing = prev.find(i => i.id === itemId)

            if (existing) {
                return prev.map(i =>
                    i.id == itemId ? { ...i, quantity, price } : i
                )
            }

            return [...prev, { id: itemId, quantity, price }]
        })
    }
    
    return (
        <div className='cart'>
            {modal.open && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h2 className={`modal-${modal.success ? "success" : "error"}`}>{modal.success ? "Success" : "Error"}</h2>
                        <p>{modal.success ? (
                                <>
                                    Purchase successful<span className="aces">!</span><br/>
                                    {modal.items} item{modal.items != 1 ? "s" : ""} for <span className="aces">$</span>{modal.total.toLocaleString()}
                                </>
                            ) : (
                                modal.error
                            )}
                        </p>
                        <Button onClick={() => {
                            setModal(prev => ({ ...prev, open: false }))
                            if (modal.success) {
                                navigate("/shop")
                            }
                        }}>OK</Button>
                    </div>
                </div>
            )}
            <div className='cart-content'>
                <Button className={"filters-clear" + ((cart?.length <= 0) ? " clear-hidden" : "")} onClick={() => {
                    setCart([])
                    navigate("/shop")
                }}>X CLEAR CART</Button>
                <h1>CART</h1>
                <ul className='cart-items'>
                    {(cart && items) && cart.map(cartItem => {
                        const fullItem = items.find(i => i.id == cartItem.id)
                        if (!fullItem) return null
                        return <li className='cart-item' key={cartItem.id}>
                            <div className='cart-item-quantity'>{cartItem.quantity}</div>
                            <div className='cart-item-name'>{fullItem.name ?? cartItem.id}</div>
                            <div className='cart-item-price'>{(cartItem.price * cartItem.quantity).toLocaleString()}</div>
                        </li>
                    })}
                </ul>
                <div className='total'>Total <span className='aces'>$</span>{cartTotal.toLocaleString()}</div>
                <Button className='buy' onClick={async () => {
                    try {
                        console.log(cart)
                        const resp = await fetch("/api/purchase", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({cart})
                        })
                        const data = await resp.json()
                        if (!resp.ok) {
                            setModal({
                                open: true,
                                success: false,
                                error: data?.error || "Purchase failed."
                            })
                            return
                        }
                        await loadUser()
                        setCart([])
                        setModal({
                            open: true,
                            success: true,
                            items: data?.items?.length || 0,
                            total: data?.total || 0
                        })
                    } catch (err) {
                        console.error(err)
                        setModal({
                            open: true,
                            success: false,
                            error: "Network or server error."
                        })
                    }
                }}>BUY</Button>
            </div>
            <div className='items'>
                <div className='items-grid'>
                    {(cart && items) && cart.map(cartItem => {
                        const fullItem = items.find(i => i.id == cartItem.id)
                        if (!fullItem) return null
                        return <Item key={cartItem.id} item={fullItem} owned={[ownedMap[fullItem.id] || 0]} cart={cart} changeQuantity={changeQuantity}/>
                    })}
                </div>
                <div className='back-container'>
                    <Button href="/shop" className='back-btn'>BACK</Button>
                </div>
            </div>
        </div>
    )
}