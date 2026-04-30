import { useLoaderData } from 'react-router'
import '../assets/styles/shop.css'
import { useMemo, useState } from 'react'
import Button from '../components/Button'
import TextInput from '../components/TextInput'
import Item from '../components/Item'

export async function loader() {
    const [itemsRes, userItemsRes] = await Promise.all([
        fetch("/api/items", { credentials: "include" }),
        fetch("/api/user-items", { credentials: "include" }),
    ])

    if (!itemsRes.ok) {
        throw new Response("Failed to load items", { status: itemsRes.status })
    }

    const items = await itemsRes.json()
    const userItems = userItemsRes.ok ? await userItemsRes.json() : []

    const ownedItems = userItems.map(u => {
        const item = items.find(i => i.id === u.item_id)
        return item ? { ...item, owned: u.quantity } : null
    })

    return ownedItems
}

export default function Storage() {
    const items = useLoaderData() ?? []
    
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('all')
    const [subcategory, setSubcategory] = useState('all')

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

    return (
        <div className='storage'>
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
                    {filteredItems && filteredItems.map(item => (<Item key={item.id} item={item} storage/>))}
                </div>
            </div>
        </div>
    )
}