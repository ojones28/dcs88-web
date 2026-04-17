import '../assets/styles/shop.css'
import { useEffect, useMemo, useState } from "react"
import Item from "../components/Item"
import Button from '../components/Button'
import TextInput from '../components/TextInput'
import { useLoaderData } from 'react-router'

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

export default function Shop() {
    const { items, userItems } = useLoaderData()
    const [cart, setCart] = useState(() =>
        JSON.parse(localStorage.getItem("cart") || "[]")
    )
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('all')
    const [subcategory, setSubcategory] = useState('all')

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart))
    }, [cart])

    const categories = useMemo(() => {
        return items.map(i => i.category).filter((v, i, arr) => arr.indexOf(v) == i)
    }, [items])

    const categoryNames = {
        "aam": "AIR TO AIR MISSILES",
        "agm": "AIR TO GROUND MISSILES",
        "bomb": "BOMBS",
        "rkt": "ROCKETS"
    }

    const subcategories = useMemo(() => {
        return items.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = []
            }

            if (!acc[item.category].includes(item.subcategory)) {
                acc[item.category].push(item.subcategory)
            }

            return acc
        }, {})
    }, [items, category])

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesCategory = category == 'all' || item.category === category
            const matchesSubcategory = subcategory == 'all' || item.subcategory == subcategory
            const matchesSearch =
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.long_name.toLowerCase().includes(search.toLowerCase()) ||
                item.category.toLowerCase().includes(search.toLowerCase()) ||
                item.subcategory.toLowerCase().includes(search.toLowerCase()) ||
                item.name.toLowerCase().includes(search.toLowerCase())

            return matchesCategory && matchesSubcategory && matchesSearch
        })
    }, [items, category, subcategory, search])

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
        <div className='shop'>
            <div className='filters'>
                <Button className={"filters-clear" + ((category == "all" && search == '') ? " clear-hidden" : "")} onClick={() => {
                    setCategory("all")
                    setSubcategory("all")
                    setSearch('')
                }}>X CLEAR FILTERS</Button>
                <div className='filter-border'>
                    <TextInput
                        className="search"
                        placeholder="SEARCH"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className='filter-categories'>
                        {categories && categories.map(c => <div key={c}>
                                <Button className={'category' + (category == c ? " active" : "")} onClick={() => setCategory((cat) => {
                                    if (cat == c) {
                                        setSubcategory("all")
                                        return "all"
                                    }
                                    return c
                                })}>{categoryNames[c] ?? c}</Button>
                                {subcategories[c] && <ul>
                                    {subcategories[c].map(s => <li key={s}><Button className={"subcategory" + ((subcategory == s && category == c) ? " active" : "")} onClick={() => setSubcategory((sub) => {
                                        if (sub == s) {
                                            return "all"
                                        }
                                        if (category != c) {
                                            setCategory(c)
                                        }
                                        return s
                                    })}>{s}</Button></li>)}
                                </ul>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className='items'>
                <div className='items-grid'>
                    {filteredItems && filteredItems.map(item => (<Item key={item.id} item={item} owned={[ownedMap[item.id] || 0]} cart={cart} changeQuantity={changeQuantity}/>))}
                </div>
                <div className='cart-container'>
                    <Button href="/shop/cart" className='cart-btn'><div>
                        Cart ({cart.length})
                    </div>
                    <div className='cart-total'>
                        <span className='aces'>$</span>{cartTotal.toLocaleString()}
                    </div></Button>
                </div>
            </div>
        </div>
    )
}