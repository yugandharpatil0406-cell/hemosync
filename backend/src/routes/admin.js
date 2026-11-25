const express = require('express');
const db = require('../utils/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// GET /api/admin/dashboard - Comprehensive system analytics
router.get('/dashboard', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    // 1. Overall counts
    const [counts] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM donors) as total_donors,
        (SELECT COUNT(*) FROM donors WHERE status = 'active') as active_donors,
        (SELECT COUNT(*) FROM appointments) as total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'confirmed') as confirmed_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'waiting') as waiting_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'donated') as completed_donations,
        (SELECT IFNULL(SUM(units_available), 0) FROM blood_inventory WHERE status = 'available' AND expiry_date >= CURDATE()) as total_units_available,
        (SELECT COUNT(*) FROM blood_requests WHERE status = 'pending') as pending_requests,
        (SELECT COUNT(*) FROM blood_requests WHERE status = 'fulfilled') as fulfilled_requests
    `);

    // 2. Inventory distribution across all 8 blood groups
    const [inventoryByGroup] = await db.execute(`
      SELECT bg.group_name,
             IFNULL(SUM(CASE WHEN bi.status = 'available' AND bi.expiry_date >= CURDATE() THEN bi.units_available ELSE 0 END), 0) as units_available,
             IFNULL(SUM(bi.units_reserved), 0) as units_reserved
      FROM blood_groups bg
      LEFT JOIN blood_inventory bi ON bg.id = bi.blood_group_id
      GROUP BY bg.id, bg.group_name
      ORDER BY bg.id
    `);

    // 3. Recent 5 donations
    const [recentDonations] = await db.execute(`
      SELECT dr.id, dr.donation_date, dr.units_donated,
             bg.group_name as blood_group,
             u.first_name, u.last_name
      FROM donation_records dr
      JOIN blood_groups bg ON dr.blood_group_id = bg.id
      JOIN donors d ON dr.donor_id = d.id
      JOIN users u ON d.user_id = u.id
      ORDER BY dr.created_at DESC
      LIMIT 5
    `);

    // 4. Recent 5 requests
    const [recentRequests] = await db.execute(`
      SELECT br.id, br.patient_name, br.hospital_name, br.units_requested,
             br.urgency, br.status, br.request_date,
             bg.group_name as blood_group
      FROM blood_requests br
      JOIN blood_groups bg ON br.blood_group_id = bg.id
      ORDER BY br.created_at DESC
      LIMIT 5
    `);

    // 5. Active scheduling configuration
    const [configRows] = await db.execute(
      'SELECT algorithm, time_quantum, updated_at FROM scheduler_config WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
    );

    res.json({
      success: true,
      data: {
        summary: counts[0],
        inventory_distribution: inventoryByGroup,
        recent_donations: recentDonations,
        recent_requests: recentRequests,
        scheduler_config: configRows[0] || { algorithm: 'FCFS', time_quantum: 3 }
      }
    });
  } catch (err) {
    console.error('Error fetching admin dashboard:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard stats', error: err.message });
  }
});

// GET /api/admin/audit-logs - Audit trail
router.get('/audit-logs', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { action, limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT al.id, al.user_id, al.action, al.entity_type, al.entity_id,
             al.old_values, al.new_values, al.ip_address, al.created_at,
             u.email, u.role, u.first_name, u.last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }

    query += ' ORDER BY al.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    const [count] = await db.query('SELECT COUNT(*) as total FROM audit_logs');

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count[0].total
      }
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs', error: err.message });
  }
});

// GET /api/admin/users - List users
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = `
      SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone,
             u.is_active, u.created_at,
             bg.group_name as blood_group,
             d.total_donations
      FROM users u
      LEFT JOIN donors d ON u.id = d.user_id
      LEFT JOIN blood_groups bg ON d.blood_group_id = bg.id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }
    if (search) {
      query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY u.id ASC';

    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve users', error: err.message });
  }
});

// PATCH /api/admin/users/:id/status - Toggle user active status
router.patch('/users/:id/status', authenticate, authorize('admin'), async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
    await logAudit(req.user.id, 'USER_STATUS_UPDATED', 'users', id, null, { is_active }, req.ip);

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ success: false, message: 'Failed to update user status', error: err.message });
  }
});

module.exports = router;
