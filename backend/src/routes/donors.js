const express = require('express');
const db = require('../utils/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// GET /api/donors - List donors with filters
router.get('/', authenticate, authorize('staff', 'admin'), async (req, res) => {
  try {
    const { blood_group, status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT d.id, d.user_id, u.first_name, u.last_name, u.email, u.phone,
             bg.group_name as blood_group, d.date_of_birth, d.gender, d.address,
             d.medical_notes, d.last_donation_date, d.total_donations, d.status,
             d.created_at
      FROM donors d
      JOIN users u ON d.user_id = u.id
      JOIN blood_groups bg ON d.blood_group_id = bg.id
      WHERE 1=1
    `;
    const params = [];

    if (blood_group) {
      query += ' AND bg.group_name = ?';
      params.push(blood_group);
    }
    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY d.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);

    // Get total count
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM donors');

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total
      }
    });
  } catch (err) {
    console.error('Error fetching donors:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve donors', error: err.message });
  }
});

// GET /api/donors/me - Current donor's profile
router.get('/me', authenticate, authorize('donor'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.id, d.user_id, u.first_name, u.last_name, u.email, u.phone,
             bg.group_name as blood_group, d.date_of_birth, d.gender, d.address,
             d.medical_notes, d.last_donation_date, d.total_donations, d.status
      FROM donors d
      JOIN users u ON d.user_id = u.id
      JOIN blood_groups bg ON d.blood_group_id = bg.id
      WHERE d.user_id = ?
    `, [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Donor profile not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching donor profile:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile', error: err.message });
  }
});

// GET /api/donors/history - Current donor's donation history
router.get('/history', authenticate, authorize('donor'), async (req, res) => {
  try {
    const [donorRows] = await db.execute('SELECT id FROM donors WHERE user_id = ?', [req.user.id]);
    if (donorRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    const donorId = donorRows[0].id;
    const [rows] = await db.execute(`
      SELECT dr.id, dr.donation_date, dr.units_donated, dr.hemoglobin_level,
             dr.blood_pressure, dr.temperature, dr.notes,
             bg.group_name as blood_group,
             ds.location, ds.slot_date, ds.start_time
      FROM donation_records dr
      JOIN blood_groups bg ON dr.blood_group_id = bg.id
      JOIN appointments a ON dr.appointment_id = a.id
      JOIN donation_slots ds ON a.slot_id = ds.id
      WHERE dr.donor_id = ?
      ORDER BY dr.donation_date DESC
    `, [donorId]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching donation history:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve history', error: err.message });
  }
});

module.exports = router;
