import express from 'express'
import pool from '../database.js'

const router = express.Router()

router.get('/test', async (req, res) => {
    // console.log(bcrypt.hashSync("test", 10))
    console.log("Test")
    try {
        const [rows] = await pool.query('SELECT * FROM aircraft')
        res.json(rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Database error' })
    }
})

router.post('/test', async (req, res) => {
    console.log("Test post")
    console.log(req.body)
    console.log(req.ip)
})

export default router