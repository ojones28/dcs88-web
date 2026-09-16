import { useEffect, useRef } from "react"
import Button from "../../components/Button"

export default function Trade() {
    // const wsRef = useRef(null)

    // useEffect(() => {
    //     const ws = new WebSocket(`ws://localhost:8889`) // set to api.dcs88.xyz:8889
    //     wsRef.current = ws
    //     ws.onopen = () => {
    //         const token = document.cookie.split('; ').find(r => r.startsWith('session='))?.split('=')[1]
    //         ws.send(JSON.stringify({ type: 'auth', token }))
    //         setStatus('connected')
    //     }

    //     ws.onmessage = (e) => {
    //         const msg = JSON.parse(e.data)
    //         console.log(msg)
    //     }

    //     // ws.onclose = () => setStatus('disconnected')
    //     return () => ws.close()
    // }, [])

    return (
        <div className="trade">
            hi
        </div>
    )
}