import express from 'express'
import pool from '../database.js'
import { requireAuth } from '../auth.js'

const router = express.Router()

router.get('/items', async (req, res) => {
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
            params.push(subcategory)
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

router.post('/purchase', requireAuth, async (req, res) => {
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
            [req.user.id, total]
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
                [req.user.id, id, qty, cost, transactionId]
            )

            await connection.execute(
                `INSERT INTO user_items (user_id, item_id, quantity)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
                [req.user.id, id, quantity]
            )
        }

        const [moneyRows] = await connection.execute(
            'SELECT money FROM users WHERE id = ? LIMIT 1 FOR UPDATE',
            [req.user.id]
        )

        const currentMoney = moneyRows[0]?.money ?? 0
        if (currentMoney < total) {
            throw new Error('Not enough money')
        }

        await connection.execute(
            'UPDATE users SET money = money - ? WHERE id = ?',
            [total, req.user.id]
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

export default router