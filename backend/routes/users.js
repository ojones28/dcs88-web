import express from 'express'
import pool from '../database.js'
import { requireAuth } from '../auth.js'

const router = express.Router()

router.get('/transactions', requireAuth, async (req, res) => {
    const [rows] = await pool.execute(
        `SELECT *
        FROM user_money_history
        WHERE user_id = ?
        ORDER BY time ASC
        LIMIT 20`,
        [req.user.id]
    )

    res.json(rows.reverse())
})

router.get('/achievements', requireAuth, async (req, res) => {
    const [rows] = await pool.execute(
        `SELECT
            a.id,
            a.name,
            a.description,
            a.progress_max,
            a.reward,
            COALESCE(ua.progress, 0) AS progress,
            ua.unlocked_at,
            CASE
                WHEN ua.user_id IS NULL THEN FALSE
                ELSE TRUE
            END AS started,
            CASE
                WHEN COALESCE(ua.progress, 0) >= a.progress_max THEN TRUE
                ELSE FALSE
            END AS completed
        FROM dcs88.achievements a
        LEFT JOIN dcs88.user_achievements ua
            ON ua.achievement_id = a.id
            AND ua.user_id = ?
        ORDER BY a.id DESC`,
        [req.user.id]
    )

    res.json(rows.reverse())
})

router.get('/me', requireAuth, async (req, res) => {
    console.log("Getting my data " + new Date().getTime())
    if (req.user) {
        return res.status(200).json({
            message: 'Sent user data',
            user: {
                username: req.user.username,
                money: req.user.money,
                linked: req.user.dcs_id != null
            }
        })
    }
})

router.get('/user-items', requireAuth, async (req, res) => {
    const [rows] = await pool.execute(
        'SELECT item_id, quantity FROM user_items WHERE user_id = ?',
        [req.user.id]
    )
    console.log("Getting my items")

    res.json(rows)
})

export default router