import { useLocation } from "react-router"
import Button from "./Button"

export default function Navbar({user}) {
    const location = useLocation()

    return (
        <div className="nav-container">
            {(user && user.username) && (
                <span className="username">{user.username}</span>
            )}
            <nav className="navbar">
                <Button href="/">HOME</Button>
                <div className="dropdown">
                    <button className={`button dropdown-toggle ${location.pathname.startsWith("/info") ? "active" : ""}`} type="button">
                        INFO
                    </button>
                    <div className="dropdown-menu">
                        <Button href="/info/news">NEWS</Button>
                        <Button href="/info/misn">MISN</Button>
                        <Button href="/info/data">DATA</Button>
                    </div>
                </div>
                <Button href="/shop" className={`${location.pathname.startsWith("/shop") ? "active" : ""}`}>SHOP</Button>
                <Button href="/arms" className={`${location.pathname.startsWith("/arms") ? "active" : ""}`}>ARMS</Button>
                <Button href="/profile/" className={`${location.pathname.startsWith("/profile") ? "active" : ""}`}>PROF</Button>
            </nav>
            {(user && user.money) && (
                <span className="money"><span className="aces">$</span>{user.money.toLocaleString()}</span>
            )}
        </div>
    )
}