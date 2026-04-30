import { useLoaderData, useOutletContext } from 'react-router'
import '../assets/styles/profile.css'
import ProfileNew from "./profile/ProfileNew"
import ProfileUser from './profile/ProfileUser'

export async function loader() {
    const res = await fetch("/api/transactions", {
        credentials: "include",
    })

    if (res.status === 401) {
        return
    }

    if (!res.ok) {
        throw new Response("Failed to load transactions", { status: res.status })
    }

    return res.json()
}

export default function Profile() {
    const { user } = useOutletContext()
    const transactions = useLoaderData()
    
    return (
        user ? <ProfileUser transactions={transactions} /> : <ProfileNew />
    )
}