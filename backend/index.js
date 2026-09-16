


import { WebSocketServer } from 'ws'
import http from 'http'


const onlineUsers = {}
const activeTrades = {}



















// app.get('/api/online-users', async (req, res) => {
//     const token = req.cookies.session
//     if (!token) return res.status(401).json({ error: 'Not logged in' })

//     const user = await getUserFromSessionToken(token)
//     if (!user) return res.status(401).json({ error: 'Invalid session' })

//     const users = Object.entries(onlineUsers).filter(([id]) => id != user.id).map(([id, ws]) => ({ id, username: ws.username }))
//     console.log(users)
//     res.json(users)
// })
    
// const server = http.createServer(app)
// const wss = new WebSocketServer({ server })

// function send(ws, data) {
//     if (ws?.readyState === 1) ws.send(JSON.stringify(data))
// }

// wss.on('connection', async (ws, req) => {
//     const cookieHeader = req.headers.cookie ?? ''
//     const token = cookieHeader.split('; ').find(r => r.startsWith('session='))?.split('=')[1]
    
//     if (!token) return ws.close()
    
//     const user = await getUserFromSessionToken(token)
//     if (!user) return ws.close()

//     ws.username = user.username
//     ws.userId = user.id
//     onlineUsers[user.id] = ws
//     console.log(Object.keys(onlineUsers))

//     ws.on('message', async (raw) => {
//         const msg = JSON.parse(raw)

//         if (msg.type == 'trade_request') {
//             const targetWs = onlineUsers[msg.targetUserId]
//             if (!targetWs) return send(ws, { type: 'error', message: 'User is offline' })

//             const tradeId = crypto.randomUUID()
//             activeTrades[tradeId] = { from: user.id, to: msg.targetUserId, status: 'pending' }

//             send(targetWs, {
//                 type: 'trade_request',
//                 fromUsername: user.username,
//                 tradeId
//             })
//             send(ws, { type: 'trade_request_sent', tradeId })
//         }
//     })

//     ws.on('close', () => {
//         delete onlineUsers[user.id]
//         console.log(Object.keys(onlineUsers))
//     })
// })
    
// const port = process.env.PORT || 4000
// server.listen(port, () => console.log(`API server listening on http://localhost:${port}`))