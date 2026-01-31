import { NavLink } from "react-router";

export default function Navbar() {
    return (
        <div className="nav-container">
            <nav className="navbar">
                <NavLink className="button" to="/" end>HOME</NavLink>
                <NavLink className="button" to="/news">NEWS</NavLink>
            </nav>
        </div>
    )
}