import { useOutletContext } from 'react-router'
import '../assets/styles/profile.css'
import ProfileNew from "./profile/ProfileNew"
import ProfileUser from './profile/ProfileUser'

export default function Profile() {
    const { user } = useOutletContext()
    
    return (
        user ? <ProfileUser /> : <ProfileNew />
    )
}