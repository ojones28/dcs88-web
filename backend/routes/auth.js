import express from 'express'
import bcrypt from 'bcrypt'
import { createSession } from '../auth.js'
import pool from '../database.js'

const router = express.Router()

router.post('/logout', async (req, res) => {
    console.log("Logout")
    try {
        const token = req.cookies.session

        if (token) {
            await pool.execute(
                'UPDATE users SET session_token = NULL WHERE session_token = ?',
                [token]
            )
        }

        res.clearCookie('session', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        })

        return res.status(200).json({ message: 'Logged out' })
    } catch (err) {
        console.error(err)

        res.clearCookie('session', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        })

        return res.status(500).json({ error: 'Logout failed' })
    }
})

router.post('/login', async (req, res) => {
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

router.post('/register', async (req, res) => {
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

router.post('/getlink', async (req, res) => {
    const cookies = req.cookies
    if (cookies.session) {
        const user = await getUserFromSessionToken(cookies.session)
        if (user) {
            console.log("Generating link code")
            console.log(user)
            if (!user.dcs_id) {
                const code = await generateLinkCode(user.id)
                return res.status(200).json({
                    message: 'Generated link code',
                    code: code
                })
            } else {
                return res.status(400).json({ error: 'User already linked' })
            }
        } else {
            return res.status(401).json({ error: 'Invalid session id' })
        }
    } else {
        return res.status(401).json({ error: 'No session id' })
    }
})

router.post('/link', async (req, res) => {
    const { dcsId, linkCode } = req.body
    if (linkCode && dcsId) {
        console.log("Linking user")
        const linked = await linkUser(linkCode, dcsId)
        const user = await getUserFromDcsId(dcsId)
        if (linked.success && user) {
            return res.status(200).json({
                message: 'User linked',
                user: {
                    username: user.username,
                    money: user.money
                }
            })
        } else {
            return res.status(401).json({ error: linked.error ?? 'Could not link user' })
        }
    } else {
        return res.status(401).json({ error: 'No link code or DCS id' })
    }
})

router.post('/api/linked', async (req, res) => {
    const { dcsId } = req.body
    if (dcsId) {
        const user = await getUserFromDcsId(dcsId)
        console.log("Getting user data for link " + new Date().getTime())
        if (user) {
            return res.status(200).json({
                message: 'Sent user data',
                user: {
                    username: user.username,
                    money: user.money
                }
            })
        } else {
            return res.status(401).json({ error: 'Invalid DCS id' })
        }
    } else {
        return res.status(401).json({ error: 'No DCS id' })
    }
})

export default router