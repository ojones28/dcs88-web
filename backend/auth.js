import crypto from 'crypto'
import pool from './database.js'

export async function createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex')
    await pool.execute('UPDATE users SET session_token = ? WHERE id = ?', [token, userId])
    return token
}

export async function getUserFromSessionToken(token) {
    const [rows] = await pool.execute(
        'SELECT id, username, money, dcs_id FROM users WHERE session_token = ? LIMIT 1',
        [token]
    )
    return rows.length ? rows[0] : null
}

export async function getUserFromDcsId(token) {
    const [rows] = await pool.execute(
        'SELECT id, username, money FROM users WHERE dcs_id = ? LIMIT 1',
        [token]
    )
    return rows.length ? rows[0] : null
}

export async function requireAuth(req, res, next) {
    try {
        const token = req.cookies.session

        if (!token) {
            return res.status(401).json({
                error: 'Not logged in'
            })
        }

        const user = await getUserFromSessionToken(token)

        if (!user) {
            return res.status(401).json({
                error: 'Invalid session'
            })
        }

        req.user = user
        next()
    } catch (err) {
        console.error(err)

        res.status(500).json({
            error: 'Authentication error'
        })
    }
}

export async function generateLinkCode(userId) {
    const linkCode = crypto.randomInt(100000, 999999).toString()
    await pool.execute(
        'UPDATE users SET link_code = ?, link_code_created_at = CURRENT_TIMESTAMP WHERE id = ?',
        [linkCode, userId]
    )
    return linkCode
}

export async function linkUser(linkCode, dcsId) {
    const connection = await pool.getConnection()

    try {
        await connection.beginTransaction()

        const [existing] = await connection.execute(
            `SELECT id
             FROM users
             WHERE dcs_id = ?
             LIMIT 1`,
            [dcsId]
        )

        if (existing.length > 0) {
            throw new Error('DCS account already linked')
        }

        const [rows] = await connection.execute(
            `SELECT id, link_code_created_at
             FROM users
             WHERE link_code = ?
             LIMIT 1
             FOR UPDATE`,
            [linkCode]
        )

        if (!rows.length) {
            throw new Error('Invalid link code')
        }

        const user = rows[0]

        const created = new Date(user.link_code_created_at).getTime()
        const now = Date.now()

        if ((now - created) > 1000 * 60 * 5) {
            throw new Error('Link code expired')
        }

        await connection.execute(
            `UPDATE users
             SET dcs_id = ?,
                 link_code = NULL,
                 link_code_created_at = NULL
             WHERE id = ?`,
            [dcsId, user.id]
        )

        await connection.commit()

        return { success: true }
    } catch (err) {
        await connection.rollback()
        console.error(err)
        return { success: false, error: err.message}
    } finally {
        connection.release()
    }
}