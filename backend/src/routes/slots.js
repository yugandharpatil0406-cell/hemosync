const express = require('express');
const db = require('../utils/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// GET /api/slots - View donation slots (accessible by all authenticated users or public for booking)
router.get('/', async (req, res) => {
  try {
    const { date, status, location } = req.query;
    let query = `
      SELECT ds.id, ds.slot_date, ds.start_time, ds.end_time, ds.location,
             ds.capacity, ds.available_capacity, ds.status,
             u.first_name as created_by_first, u.last_name as created_by_last,
             (ds.capacity - ds.available_capacity) as booked_count
      FROM donation_slots ds
      LEFT JOIN users u ON ds.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND ds.slot_date = ?';
      params.push(date);
    }
    if (status) {
      query += ' AND ds.status = ?';
      params.push(status);
    }
    if (location) {
      query += ' AND ds.location LIKE ?';
      params.push(`%${location}%`);
    }

    query += ' ORDER BY ds.slot_date ASC, ds.start_time ASC';

    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching slots:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve slots', error: err.message });
  }
});

// POST /api/slots - Create new donation slot (Admin or Staff only)
router.post('/', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { slot_date, start_time, end_time, location, capacity } = req.body;

    if (!slot_date || !start_time || !end_time || !location || !capacity) {
      return res.status(400).json({ success: false, message: 'All slot fields are required' });
    }

    if (capacity <= 0) {
      return res.status(400).json({ success: false, message: 'Capacity must be greater than zero' });
    }

    const [result] = await db.execute(`
      INSERT INTO donation_slots (slot_date, start_time, end_time, location, capacity, available_capacity, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'open', ?)
    `, [slot_date, start_time, end_time, location, capacity, capacity, req.user.id]);

    await logAudit(req.user.id, 'SLOT_CREATED', 'donation_slots', result.insertId, null, req.body, req.ip);

    res.status(201).json({
      success: true,
      message: 'Donation slot created successfully',
      data: { id: result.insertId, slot_date, start_time, end_time, location, capacity, available_capacity: capacity }
    });
  } catch (err) {
    console.error('Error creating slot:', err);
    res.status(500).json({ success: false, message: 'Failed to create slot', error: err.message });
  }
});

module.exports = router;
