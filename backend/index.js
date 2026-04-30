import bcrypt from 'bcrypt'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import mysql from 'mysql2/promise'
import crypto from 'crypto'
import 'dotenv/config'

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())
app.use(cookieParser())

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 80,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

app.get('/api/test', async (req, res) => {
    console.log(bcrypt.hashSync("test", 10))
    try {
        const [rows] = await pool.query('SELECT * FROM aircraft')
        res.json(rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Database error' })
    }
})

async function createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex')
    await pool.execute('UPDATE users SET session_token = ? WHERE id = ?', [token, userId])
    return token
}

async function getUserFromSessionToken(token) {
    const [rows] = await pool.execute(
        'SELECT id, username, money FROM users WHERE session_token = ? LIMIT 1',
        [token]
    )
    return rows.length ? rows[0] : null
}

app.get('/api/items', async (req, res) => {
    try {
        const { category, subcategory } = req.query
        let q = 'SELECT * FROM items'
        const params = []
        const where = []
        if (category) {
            where.push('category = ?')
            params.push(category)
        }
        if (subcategory) {
            where.push('subcategory = ?')
            params.push(category)
        }

        if (where.length) {
            q += ' WHERE ' + where.join(' AND ')
        }
        q += ' ORDER BY category, subcategory, name'
        const [rows] = await pool.execute(q, params)
        res.status(200).json(rows)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'Database error' })
    }
})

app.get('/api/transactions', async (req, res) => {
    const { session } = req.cookies
    if (!session) {
        return res.status(401).json({ error: 'Not logged in' })
    }

    const user = await getUserFromSessionToken(session)
    if (!user) {
        return res.status(401).json({ error: 'Invalid session' })
    }

    const [rows] = await pool.execute(
        `SELECT *
        FROM user_money_history
        WHERE user_id = ?
        ORDER BY time ASC`,
        [user.id]
    )

    res.json(rows.reverse())
})

app.get('/api/me', async (req, res) => {
    const cookies = req.cookies
    if (cookies.session) {
        const user = await getUserFromSessionToken(cookies.session)
        console.log("Getting my data " + new Date().getTime())
        if (user) {
            return res.status(200).json({
                message: 'Sent user data',
                user: {
                    username: user.username,
                    money: user.money
                }
            })
        } else {
            return res.status(401).json({ error: 'Invalid session id' })
        }
    } else {
        return res.status(401).json({ error: 'No session id' })
    }
})

app.get('/api/user-items', async (req, res) => {
    const cookies = req.cookies
    if (!cookies.session) {
        return res.status(401).json({ error: 'Not logged in' })
    }

    const user = await getUserFromSessionToken(cookies.session)
    if (!user) {
        return res.status(401).json({ error: 'Invalid session' })
    }

    const [rows] = await pool.execute(
        'SELECT item_id, quantity FROM user_items WHERE user_id = ?',
        [user.id]
    )
    console.log("Getting my items")

    res.json(rows)
})

app.post('/api/purchase', async (req, res) => {
    const cookies = req.cookies
    if (!cookies.session) {
        return res.status(401).json({ error: 'Not logged in' })
    }
    const user = await getUserFromSessionToken(cookies.session)
    if (!user) {
        return res.status(401).json({ error: 'Invalid session' })
    }
    const { cart } = req.body
    if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' })
    }
    console.log(cart)

    const connection = await pool.getConnection()
    try {
        await connection.beginTransaction()

        let total = 0
        const resolvedItems = []
        
        const [historyResult] = await connection.execute(
            `INSERT INTO user_money_history (user_id, type, total_value, money_after)
            VALUES (?, 'shop', ?, 0)`,
            [user.id, total]
        )

        const transactionId = historyResult.insertId
        
        for (const entry of cart) {
            const { id, quantity, price } = entry
            const qty = Number(quantity)
            const cost = Number(price)

            if (!id || !Number.isInteger(qty) || qty < 1) {
                throw new Error('Invalid cart item')
            }

            const [rows] = await connection.execute(
                'SELECT id, name, default_cost, quantity FROM items WHERE id = ? LIMIT 1 FOR UPDATE',
                [id]
            )

            if (!rows.length) {
                throw new Error(`Item not found: ${id}`)
            }

            const item = rows[0]
            if (item.quantity < qty) {
                throw new Error(`Not enough stock for ${item.name}`)
            }

            if (item.default_cost != cost) {
                throw new Error(`Unexpected price for ${item.name}: Expected ${cost}, got ${item.default_cost}`)
            }

            const lineCost = item.default_cost * qty
            total += lineCost
            resolvedItems.push({
                id: item.id,
                name: item.name,
                quantity: qty,
                unitPrice: item.default_cost,
                lineCost
            })

            await connection.execute(
                'UPDATE items SET quantity = quantity - ? WHERE id = ?',
                [qty, id]
            )

            await connection.execute(
                'INSERT INTO user_purchases (user_id, item_id, quantity, cost, transaction_id) VALUES (?, ?, ?, ?, ?)',
                [user.id, id, qty, cost, transactionId]
            )

            await connection.execute(
                `INSERT INTO user_items (user_id, item_id, quantity)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
                [user.id, id, quantity]
            )
        }

        const [moneyRows] = await connection.execute(
            'SELECT money FROM users WHERE id = ? LIMIT 1 FOR UPDATE',
            [user.id]
        )

        const currentMoney = moneyRows[0]?.money ?? 0
        if (currentMoney < total) {
            throw new Error('Not enough money')
        }

        await connection.execute(
            'UPDATE users SET money = money - ? WHERE id = ?',
            [total, user.id]
        )

        await connection.execute(
            `UPDATE user_money_history
            SET total_value = ?, money_after = ?
            WHERE id = ?`,
            [-total, currentMoney - total, transactionId]
        )

        await connection.commit()
        res.json({
            message: 'Purchase successful',
            total,
            items: resolvedItems
        })
    } catch (err) {
        await connection.rollback()
        console.error(err)
        res.status(400).json({ error: err.message || 'Purchase failed' })
    } finally {
        connection.release()
    }
})

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body
        if (!username || !password) return res.status(400).json({ error: `Missing ${(!username ? 'username' : '') + ((!username && !password) ? ' and ' : '') + (!password ? 'password' : '')}` })
        
        const [rows] = await pool.execute(
            'SELECT id, username, password_hash, money FROM users WHERE username = ? LIMIT 1',
            [username]
        )

        if (!rows.length) {
            return res.status(401).json({ error: 'Invalid username or password' })
        }

        const user = rows[0]
        const validUser = await bcrypt.compare(password, user.password_hash)

        if (!validUser) {
            return res.status(401).json({ error: 'Invalid username or password' })
        }

        const token = await createSession(user.id)

        res.cookie('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV == 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 30
        })
        console.log(`User logged in: ${user.username}`)
        return res.status(200).json({
            message: 'Logged in',
            user: {
                username: user.username,
                money: user.money
            }
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'Database error' })
    }
})

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body
        if (!username || !password) return res.status(400).json({ error: `Missing ${(!username ? 'username' : '') + ((!username && !password) ? ' and ' : '') + (!password ? 'password' : '')}` })

        const allowedSpecial = "_-/\\()+*"
        const allowedSetRegex = new RegExp(`^[a-z0-9${allowedSpecial.replace(/[-\\^]/g, "\\$&")}]+$`)

        const usernameRules = [
            {
                key: "length",
                test: (u) => u.length >= 3 && u.length <= 16,
                message: "Must be between 3 and 16 characters."
            },
            {
                key: "chars",
                test: (u) => allowedSetRegex.test(u),
                message: `Only letters, numbers, and "${allowedSpecial}" are allowed. No spaces.`
            }
        ]

        const passwordRules = [
            {
                key: "length",
                test: (u) => u.length >= 8,
                message: "Must be 8 or more characters."
            },
            {
                key: "chars",
                test: (u) => allowedSetRegex.test(u),
                message: `Only letters, numbers, and "${allowedSpecial}" are allowed. No spaces.`
            }
        ]

        function validate(v, rules) {
            const value = (v || "").trim().toLowerCase()
            const failed = rules.filter(r => !r.test(value)).map(r => ({key: r.key, message: r.message}))
            return failed
        }

        const usernameFailed = validate(username, usernameRules)
        const passwordFailed = validate(password, passwordRules)

        if (usernameFailed.length > 0 || passwordFailed.length > 0) {
            return res.status(409).json({ error: 'Values do not match requirements' })
        }

        const [result] = await pool.execute(
            'INSERT INTO USERS (username, password_hash) VALUES (?, ?)',
            [username, bcrypt.hashSync(password, 10)]
        )
        console.log(`User created: ${username}`)
        
        const userId = result.insertId
        const [rows] = await pool.execute(
            'SELECT id, username, money FROM users WHERE id = ? LIMIT 1',
            [userId]
        )
        const user = rows[0]
        const token = await createSession(user.id)

        await pool.execute(
            `INSERT INTO user_money_history (user_id, type, total_value, money_after) VALUES (?, 'initial', ?, ?)`,
            [user.id, user.money, user.money]
        )
        
        res.cookie('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV == 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 30
        })
        console.log(`User logged in: ${user.username}`)
        return res.status(200).json({
            message: 'User created and logged in',
            user: {
                username: user.username,
                money: user.money
            }
        })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username already exists' })
        }
        console.error(err)
        return res.status(500).json({ error: 'Database error' })
    }
})

const port = process.env.PORT || 4000
app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`)
})