import 'dotenv/config'
import http from 'http'
import { WebSocketServer } from 'ws'

import app from './app.js'
// import setupTradingWebSocket from './websocket/trading.js'

const server = http.createServer(app)

const wss = new WebSocketServer({server})

// setupTradingWebSocket(wss)

const port = process.env.PORT || 4000

server.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`)
})