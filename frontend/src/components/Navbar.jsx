import { NavLink } from "react-router";
import Button from "./Button";

export default function Navbar() {
    return (
        <div className="nav-container">
            <nav className="navbar">
                <Button>
                    <NavLink to="/" end>HOME</NavLink>
                </Button>
                <Button>
                    <NavLink to="/news" end>NEWS</NavLink>
                </Button>
                <Button>
                    <NavLink to="/profile/" end>PROF</NavLink>
                </Button>
            </nav>
        </div>
    )
}