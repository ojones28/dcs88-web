import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'

import authRoutes from './routes/auth.js'
import podRoutes from './routes/pod.js'
import shopRoutes from './routes/shop.js'
import testRoutes from './routes/test.js'
import usersRoutes from './routes/users.js'

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api', authRoutes)
app.use('/api', podRoutes)
app.use('/api', shopRoutes)
app.use('/api', testRoutes)
app.use('/api', usersRoutes)

export default app