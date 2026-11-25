const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../utils/db');
const { generateToken } = require('../utils/jwt');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, first_name, last_name, phone, blood_group, date_of_birth, gender, address } = req.body;

    if (!email || !password || !role || !first_name || !last_name) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const validRoles = ['donor', 'staff', 'admin', 'requester'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Check if user already exists
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [userResult] = await conn.execute(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [email, password_hash, role, first_name, last_name, phone || null]
      );

      const userId = userResult.insertId;

      // If donor, create donor profile
      if (role === 'donor') {
        if (!blood_group) {
          await conn.rollback();
          return res.status(400).json({ success: false, message: 'Blood group required for donors' });
        }

        const [bgRows] = await conn.execute('SELECT id FROM blood_groups WHERE group_name = ?', [blood_group]);
        if (bgRows.length === 0) {
          await conn.rollback();
          return res.status(400).json({ success: false, message: 'Invalid blood group' });
        }

        await conn.execute(
          `INSERT INTO donors (user_id, blood_group_id, date_of_birth, gender, address, status)
           VALUES (?, ?, ?, ?, ?, 'registered')`,
          [userId, bgRows[0].id, date_of_birth || null, gender || null, address || null]
        );
      }

      await conn.commit();

      const token = generateToken({ id: userId, email, role });

      await logAudit(userId, 'USER_REGISTER', 'users', userId, null, { email, role }, req.ip);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: { token, user: { id: userId, email, role, first_name, last_name } }
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const [users] = await db.execute(
      'SELECT id, email, password_hash, role, first_name, last_name, is_active FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    await logAudit(user.id, 'USER_LOGIN', 'users', user.id, null, null, req.ip);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
});

module.exports = router;
