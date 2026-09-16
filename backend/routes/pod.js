import express from 'express'
import pool from '../database.js'

const router = express.Router()

router.post('/register-pod-session', async (req, res) => {
    const { dcsId, name } = req.body
    if (!dcsId || !name) {
        return res.status(400).json({ error: 'Missing fields' })
    }
    console.log("Register session")
    const user = await getUserFromDcsId(dcsId)
    if (user) {
        const connection = await pool.getConnection()
        try {
            await connection.beginTransaction()
            await connection.execute(
                `DELETE FROM user_pod_sessions WHERE player_name = ? AND user_id != ?`,
                [name, user.id]
            )
            await connection.execute(
                `INSERT INTO user_pod_sessions (user_id, player_name)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE player_name = VALUES(player_name)`,
                [user.id, name]
            )
            await connection.commit()
            res.status(200).json({ message: 'Session registered' })
        } catch (err) {
            await connection.rollback()
            res.status(400).json({ error: err.message || 'Failed to register' })
        } finally {
            connection.release()
        }
    } else {
        return res.status(401).json({ error: 'Linked user does not exist' })
    }
})

router.post('/deregister-pod-session', async (req, res) => {
    const { dcsId } = req.body
    if (dcsId) {
        const user = await getUserFromDcsId(dcsId)
        if (user) {
            await pool.execute('DELETE FROM user_pod_sessions WHERE user_id = ?', [user.id])
            res.status(200).json({ message: 'Deregistered session' })
        } else {
            return res.status(401).json({ error: 'Linked user does not exist' })
        }
    } else {
        return res.status(401).json({ error: 'No user id' })
    }
})

router.post('/payload', async (req, res) => {
    const { name, stations, time, gun } = req.body
    if (!name || !stations || !time) {
        return res.status(400).json({ error: 'Missing fields' })
    }

    console.log("Payload")
    console.log(stations)

    const ids = stations.map(s => s.name).filter(Boolean)

    let podStations = []
    if (ids.length) {
        const placeholders = ids.map(() => '?').join(',')
        const [rows] = await pool.execute(
            `SELECT i.id, d.dcs_id FROM items i
             JOIN item_dcs_ids d ON d.item_id = i.id
             WHERE d.dcs_id IN (${placeholders}) AND i.category = 'pod'`,
            ids
        )
        const podIds = new Set(rows.map(r => r.dcs_id))
        podStations = stations.filter(s => podIds.has(s.name))
    }

    console.log(podStations)

    await pool.execute(
        `UPDATE user_pod_sessions SET stations = ?, gun = ? WHERE player_name = ?`,
        [JSON.stringify(podStations), gun ?? 0, name]
    )

    res.status(200).json({ message: 'Payload updated' })
})

async function validateUserLoadout(userId, ammoItems, podItems) {
    const allItems = [...ammoItems]

    for (const pod of podItems) {
        const existing = allItems.find(i => i.name === pod.name)
        if (existing) {
            existing.count += pod.count
        } else {
            allItems.push({ ...pod })
        }
    }

    return userHasItems(userId, allItems)
}

async function userHasItems(userId, items) {
    if (!Array.isArray(items) || items.length === 0) {
        return { hasAll: true, missing: [] }
    }

    console.log(items)

    const dcsIds = items.map(i => i.name)
    const placeholders = dcsIds.map(() => '?').join(',')

    const [rows] = await pool.execute(
        `SELECT d.dcs_id, i.id, i.name, COALESCE(ui.quantity, 0) AS quantity
        FROM item_dcs_ids d
        JOIN items i ON i.id = d.item_id
        LEFT JOIN user_items ui ON ui.item_id = d.item_id AND ui.user_id = ?
        WHERE d.dcs_id IN (${placeholders})`,
        [userId, ...dcsIds]
    )

    const equipped = {}
    for (const r of rows) {
        const item = items.find(i => i.name === r.dcs_id)
        if (!equipped[r.id]) {
            equipped[r.id] = { quantity: r.quantity, name: r.name, needed: 0 }
        }
        equipped[r.id].needed += item?.count ?? 0
    }

    console.log(equipped)
    const missing = Object.values(equipped).filter(e => e.quantity < e.needed)

    return {
        hasAll: missing.length === 0,
        missing: missing.map(e => ({ name: e.name, has: e.quantity, needed: e.needed }))
    }
}

router.post('/validate', async (req, res) => {
    const { dcsId, ammo } = req.body
    if (dcsId) {
        const user = await getUserFromDcsId(dcsId)
        console.log("Getting user data for link " + new Date().getTime())
        if (user) {
            const ammoItems = ammo.filter(a => !a.name.split(".").includes("shells")).map(a => ({
                count: a.count,
                name: a.name.split(".").pop()
            }))

            const [podRows] = await pool.execute(
                `SELECT stations FROM user_pod_sessions WHERE user_id = ?`,
                [user.id]
            )
            const podStations = podRows.length > 0 ? podRows[0].stations ?? [] : []

            const podItems = podStations.map(s => ({ name: s.name, count: 1 }))

            console.log(await validateUserLoadout(user.id, ammoItems, podItems))
        } else {
            return res.status(401).json({ error: 'Invalid DCS id' })
        }
    } else {
        return res.status(401).json({ error: 'No DCS id' })
    }
})

export default router