import { createContext, useContext, useEffect, useRef, useState } from "react";

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
    const wsRef = useRef(null)
    const [ready, setReady] = useState(false)
    const listenersRef = useRef({})
    const reconnectRef = useRef(null)

    function connect() {
        const ws = new WebSocket(import.meta.env.VITE_WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
            setReady(true)
            clearTimeout(reconnectRef.current)
        }

        ws.onmessage = (e) => {
            const msg = JSON.parse(e.data)
            const handlers = listenersRef.current[msg.type] ?? []
            handlers.forEach(fn => fn(msg))
        }

        ws.onclose = () => {
            setReady(false)
            reconnectRef.current = setTimeout(connect, 2000)
        }
    }

    useEffect(() => {
        connect()
        return () => {
            clearTimeout(reconnectRef.current)
            wsRef.current?.close()
        }
    }, [])

    function on(type, callback) {
        if (!listenersRef.current[type]) listenersRef.current[type] = []
        listenersRef.current[type].push(callback)
        return () => {
            listenersRef.current[type] = listenersRef.current[type].filter(fn => fn != callback)
        }
    }

    function send(data) {
        if (wsRef.current?.readyState == 1) wsRef.current.send(JSON.stringify(data))
    }

    return (
        <SocketContext.Provider value={{ send, on, ready }}>
            {children}
        </SocketContext.Provider>
    )
}

export function useSocket() {
    return useContext(SocketContext)
}