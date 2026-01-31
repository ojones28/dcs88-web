import { NavLink } from "react-router";

export default function Navbar() {
    return (
        <nav className="navbar">
            <NavLink className={({ isActive }) =>
                `button ${isActive ? "active" : ""}`
            } to="/" end>HOME</NavLink>
            <NavLink className="button" to="/news" end>NEWS</NavLink>
        </nav>
    )
}