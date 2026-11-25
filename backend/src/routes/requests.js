const express = require('express');
const db = require('../utils/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// POST /api/requests - Submit a blood request (Requester role)
router.post('/', authenticate, authorize('requester', 'staff', 'admin'), async (req, res) => {
  try {
    const { blood_group, units_requested, urgency = 'normal', patient_name, hospital_name, reason, notes } = req.body;

    if (!blood_group || !units_requested || !patient_name || !hospital_name) {
      return res.status(400).json({ success: false, message: 'Blood group, units, patient name, and hospital name are required' });
    }

    if (units_requested <= 0) {
      return res.status(400).json({ success: false, message: 'Units requested must be greater than zero' });
    }

    // Get blood group ID
    const [bgRows] = await db.execute('SELECT id FROM blood_groups WHERE group_name = ?', [blood_group]);
    if (bgRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid blood group' });
    }
    const bloodGroupId = bgRows[0].id;

    const [result] = await db.execute(`
      INSERT INTO blood_requests (
        requester_id, blood_group_id, units_requested, urgency,
        patient_name, hospital_name, reason, status, request_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURDATE(), ?)
    `, [
      req.user.id, bloodGroupId, units_requested, urgency,
      patient_name, hospital_name, reason || null, notes || null
    ]);

    const requestId = result.insertId;

    await logAudit(req.user.id, 'BLOOD_REQUEST_SUBMITTED', 'blood_requests', requestId, null, {
      blood_group,
      units_requested,
      urgency,
      patient_name,
      hospital_name
    }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully',
      data: {
        id: requestId,
        blood_group,
        units_requested,
        urgency,
        patient_name,
        hospital_name,
        status: 'pending'
      }
    });
  } catch (err) {
    console.error('Error submitting blood request:', err);
    res.status(500).json({ success: false, message: 'Failed to submit request', error: err.message });
  }
});

// GET /api/requests - List requests
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, urgency, blood_group } = req.query;
    let query = `
      SELECT br.id, br.requester_id, br.blood_group_id, br.units_requested,
             br.urgency, br.patient_name, br.hospital_name, br.reason,
             br.status, br.request_date, br.fulfilled_date, br.notes, br.created_at,
             bg.group_name as blood_group,
             u.first_name as requester_first, u.last_name as requester_last, u.email as requester_email,
             IFNULL((SELECT SUM(units_fulfilled) FROM request_fulfilments WHERE request_id = br.id), 0) as units_fulfilled
      FROM blood_requests br
      JOIN blood_groups bg ON br.blood_group_id = bg.id
      JOIN users u ON br.requester_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Requesters can only see their own requests
    if (req.user.role === 'requester') {
      query += ' AND br.requester_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      query += ' AND br.status = ?';
      params.push(status);
    }
    if (urgency) {
      query += ' AND br.urgency = ?';
      params.push(urgency);
    }
    if (blood_group) {
      query += ' AND bg.group_name = ?';
      params.push(blood_group);
    }

    query += ' ORDER BY CASE br.urgency WHEN "critical" THEN 1 WHEN "urgent" THEN 2 ELSE 3 END, br.created_at DESC';

    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching blood requests:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve requests', error: err.message });
  }
});

// PATCH /api/requests/:id/status - Update request status (Staff/Admin approval, or Requester cancel)
router.patch('/:id/status', authenticate, async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  try {
    const [reqs] = await db.execute('SELECT * FROM blood_requests WHERE id = ?', [id]);
    if (reqs.length === 0) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    const request = reqs[0];

    // Requesters can only cancel their own pending requests
    if (req.user.role === 'requester') {
      if (request.requester_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Permission denied' });
      }
      if (status !== 'cancelled') {
        return res.status(400).json({ success: false, message: 'Requesters can only cancel requests' });
      }
    } else if (!['staff', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    await db.execute(`
      UPDATE blood_requests
      SET status = ?, notes = IFNULL(?, notes)
      WHERE id = ?
    `, [status, notes || null, id]);

    await logAudit(req.user.id, 'REQUEST_STATUS_UPDATED', 'blood_requests', id,
      { status: request.status },
      { status, notes },
      req.ip
    );

    res.json({
      success: true,
      message: `Request status updated to '${status}'`,
      data: { id: parseInt(id), status }
    });
  } catch (err) {
    console.error('Error updating request status:', err);
    res.status(500).json({ success: false, message: 'Failed to update request', error: err.message });
  }
});

module.exports = router;
