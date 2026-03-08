import bcrypt from 'bcrypt'
import cors from 'cors'
import express from 'express'
import mysql from 'mysql2/promise';
import 'dotenv/config';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 80,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/api/test', async (req, res) => {
    console.log(bcrypt.hashSync("test", 10));
    try {
        const [rows] = await pool.query('SELECT * FROM aircraft');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/register', async (req, res) => {

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

    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: `Missing ${(!username ? 'username' : '') + ((!username && !password) ? ' and ' : '') + (!password ? 'password' : '')}` });

        const usernameFailed = validate(username, usernameRules)
        const passwordFailed = validate(password, passwordRules)

        if (usernameFailed.length > 0 || passwordFailed > 0) {
            return res.status(409).json({ error: 'Values do not match requirements' });
        }

        const [result] = await pool.execute(
            'INSERT INTO USERS (username, password_hash) VALUES (?, ?)',
            [username, bcrypt.hashSync(password, 10)]
        )
        console.log(`User created: ${username}`)
        return res.status(201).json({ message: 'User created' });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username already exists' });
        }
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
    }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
});