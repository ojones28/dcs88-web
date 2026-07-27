import { useLocation, useRevalidator } from "react-router"
import Button from "./Button"
import { useEffect, useState } from "react"
import Modal from "./Modal"
import { useSocket } from "../context/SocketContext"

export default function Navbar({user}) {
    const { on } = useSocket()
    const location = useLocation()
    const revalidator = useRevalidator()
    const [modal, setModal] = useState({
        open: false,
        success: false,
        error: "",
        code: ""
    })

    const [trade, setTrade] = useState(false)

    useEffect(() => {
        const unsub = on('trade_request', () => {
            setTrade(true)
        })
        return unsub
    }, [])

    const [ copied, setCopied ] = useState(false)

    return (
        <>
            <div className="nav-container">
                {(user && user.username) && (
                    <div className="dropdown username">
                        <Button href="/profile/" noActive className={`dropdown-toggle${!user.linked ? " notify" : ""}`}>
                            {user.username}
                        </Button>
                        <div className="dropdown-menu">
                            <Button onClick={async () => {
                                try {
                                    const resp = await fetch("/api/logout", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" }
                                    })
                                    const data = await resp.json()
                                    if (!resp.ok) {
                                        return
                                    }
                                    revalidator.revalidate()
                                } catch (err) {
                                    console.error(err)
                                }
                            }}>LOGOUT</Button>
                            <Button className={!user.linked ? "notify" : ""} onClick={async () => {
                                try {
                                    const resp = await fetch("/api/getlink", {
                                        method: "POST",
                                        credentials: "include",
                                        headers: { "Content-Type": "application/json" }
                                    })
                                    const data = await resp.json()
                                    if (!resp.ok) {
                                        setModal({
                                            open: true,
                                            success: false,
                                            code: "",
                                            error: data?.error || "Could not generate link code."
                                        })
                                        return
                                    }
                                    setModal({
                                        open: true,
                                        success: true,
                                        code: data.code,
                                        error: ""
                                    })
                                    console.log(data.code)
                                } catch (err) {
                                    setModal({
                                        open: true,
                                        success: false,
                                        error: "Network or server error."
                                    })
                                }
                            }}>Link</Button>
                        </div>
                    </div>
                )}
                <nav className="navbar">
                    <Button href="/">HOME</Button>
                    <div className="dropdown">
                        <Button href="/info/misn" className={`dropdown-toggle ${location.pathname.startsWith("/info") ? "active" : ""}`}>
                            INFO
                        </Button>
                        <div className="dropdown-menu">
                            <Button href="/info/misn">MISN</Button>
                            <Button href="/info/news">NEWS</Button>
                            <Button href="/info/data">DATA</Button>
                        </div>
                    </div>
                    <Button href="/shop" className={`${location.pathname.startsWith("/shop") ? "active" : ""}`}>SHOP</Button>
                    <Button href="/arms" className={`${[location.pathname.startsWith("/arms") && "active", trade && "notify"].filter(Boolean).join(" ")}`}>ARMS</Button>
                    <Button href="/profile" className={`${location.pathname.startsWith("/profile") ? "active" : ""}`}>PROF</Button>
                </nav>
                {(user && user.money) && (
                    <span className="money"><span className="aces">$</span>{user.money.toLocaleString()}</span>
                )}
            </div>
            <Modal open={modal.open}>
                <h2 className={`modal-${modal.success ? "success" : "error"}`}>{modal.success ? "Success" : "Error"}</h2>
                {modal.success ? (
                    <div>
                        <span>Link code generated</span><span className="aces">!</span>
                        <p>In DCS chat type</p>
                        <span className="link-code" onClick={() => {
                            const text = `-link ${modal.code}`
                            if (navigator.clipboard?.writeText) {
                                navigator.clipboard.writeText(text)
                            } else {
                                const textarea = document.createElement("textarea")
                                textarea.value = text
                                textarea.style.position = "fixed"
                                textarea.style.opacity = "0"
                                document.body.appendChild(textarea)
                                textarea.focus()
                                textarea.select()
                                try {
                                    document.execCommand("copy")
                                } catch (err) {
                                    console.error("Copy failed", err)
                                }

                                document.body.removeChild(textarea)
                            }
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                        }}>{copied ? <>Copied<span className="aces">!</span></> : `-link ${modal.code}`}</span>
                        <p>to link your account</p>
                        <p>Code will expire in 5 minutes</p>
                    </div>
                ) : (
                    <p>{modal.error}</p>
                )}
                <Button onClick={() => {
                    setModal(prev => ({ ...prev, open: false }))
                    revalidator.revalidate()
                }}>OK</Button>
            </Modal>
        </>
        
    )
}