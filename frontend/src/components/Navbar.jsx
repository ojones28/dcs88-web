import Button from "./Button";

export default function Navbar() {
    return (
        <div className="nav-container">
            <nav className="navbar">
                <Button href="/">HOME</Button>
                <Button href="/news">NEWS</Button>
                <Button href="/profile/">PROF</Button>
            </nav>
        </div>
    )
}