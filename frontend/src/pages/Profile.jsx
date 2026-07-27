import { useLoaderData, useOutletContext } from 'react-router'
import '../assets/styles/profile.css'
import ProfileNew from "./profile/ProfileNew"
import ProfileUser from './profile/ProfileUser'

export async function loader() {
    const [transactionsRes, achievementsRes] = await Promise.all([
        fetch('/api/transactions', { credentials: 'include' }),
        fetch('/api/achievements', { credentials: 'include' })
    ])

    const transactions = transactionsRes.ok ? await transactionsRes.json() : []
    const achievements = achievementsRes.ok ? await achievementsRes.json() : []

    return { transactions, achievements }
}

export default function Profile() {
    const { user } = useOutletContext()
    const { transactions, achievements } = useLoaderData()
    
    return (
        user ? <ProfileUser transactions={transactions} achievements={achievements} /> : <ProfileNew />
    )
}