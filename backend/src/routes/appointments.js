const express = require('express');
const axios = require('axios');
const db = require('../utils/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const SCHEDULER_ENGINE_URL = process.env.SCHEDULER_ENGINE_URL || 'http://localhost:5001';

// State transition rules:
// WAITING -> CONFIRMED, CANCELLED, REJECTED
// CONFIRMED -> DONATED, CANCELLED, NO_SHOW
// CANCELLED, REJECTED, DONATED, NO_SHOW are terminal
const VALID_TRANSITIONS = {
  waiting: ['confirmed', 'cancelled', 'rejected'],
  confirmed: ['donated', 'cancelled', 'no_show'],
  donated: [],
  cancelled: [],
  rejected: [],
  no_show: []
};

// POST /api/appointments/book - Book a donation slot with concurrency control
router.post('/book', authenticate, authorize('donor'), async (req, res) => {
  const { slot_id, priority_level = 5, notes } = req.body;

  if (!slot_id) {
    return res.status(400).json({ success: false, message: 'Slot ID is required' });
  }

  // Get donor profile for logged-in user
  const [donorRows] = await db.execute('SELECT id, status FROM donors WHERE user_id = ?', [req.user.id]);
  if (donorRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Donor profile not found' });
  }

  const donor = donorRows[0];
  if (donor.status === 'deferred') {
    return res.status(403).json({ success: false, message: 'Donor is currently deferred from donating blood' });
  }

  const conn = await db.getConnection();
  try {
    // Start ACID transaction
    await conn.beginTransaction();

    // 1. Check if donor already has an active appointment for this slot
    const [existing] = await conn.execute(
      'SELECT id FROM appointments WHERE donor_id = ? AND slot_id = ? AND status NOT IN ("cancelled", "rejected")',
      [donor.id, slot_id]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'You already have an active appointment for this slot.' });
    }

    // 2. Row-level lock on the donation slot using SELECT ... FOR UPDATE
    const [slots] = await conn.execute(
      'SELECT id, capacity, available_capacity, status FROM donation_slots WHERE id = ? FOR UPDATE',
      [slot_id]
    );

    if (slots.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Donation slot not found' });
    }

    const slot = slots[0];
    if (slot.status !== 'open' || slot.available_capacity <= 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'This slot is full or unavailable for booking' });
    }

    // 3. Get active scheduling algorithm
    const [configRows] = await conn.execute(
      'SELECT algorithm FROM scheduler_config WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
    );
    const algorithm = configRows.length > 0 ? configRows[0].algorithm : 'FCFS';

    // 4. Insert appointment record
    const [apptResult] = await conn.execute(`
      INSERT INTO appointments (donor_id, slot_id, priority_level, status, scheduling_algorithm, state_changed_at, notes)
      VALUES (?, ?, ?, 'confirmed', ?, NOW(), ?)
    `, [donor.id, slot_id, priority_level, algorithm, notes || null]);

    const appointmentId = apptResult.insertId;

    // 5. Decrement slot available capacity
    const newAvail = slot.available_capacity - 1;
    const newStatus = newAvail === 0 ? 'full' : 'open';

    await conn.execute(
      'UPDATE donation_slots SET available_capacity = ?, status = ? WHERE id = ?',
      [newAvail, newStatus, slot_id]
    );

    // Commit transaction
    await conn.commit();

    // Notify C++ OS Scheduler Engine (non-blocking)
    try {
      await axios.post(`${SCHEDULER_ENGINE_URL}/api/scheduler/request`, {
        donor_id: donor.id,
        slot_id: parseInt(slot_id),
        priority: parseInt(priority_level)
      }, { timeout: 1500 });
    } catch (schedErr) {
      console.warn('C++ OS Scheduler notification note:', schedErr.message);
    }

    await logAudit(req.user.id, 'APPOINTMENT_BOOKED', 'appointments', appointmentId, null, {
      donor_id: donor.id,
      slot_id,
      status: 'confirmed',
      scheduling_algorithm: algorithm
    }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Donation slot booked successfully!',
      data: {
        appointment_id: appointmentId,
        donor_id: donor.id,
        slot_id,
        status: 'confirmed',
        scheduling_algorithm: algorithm,
        remaining_capacity: newAvail
      }
    });

  } catch (err) {
    await conn.rollback();
    console.error('Error booking appointment:', err);
    res.status(500).json({ success: false, message: 'Booking failed due to server error', error: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/appointments - List appointments
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, slot_id } = req.query;
    let query = `
      SELECT a.id, a.donor_id, a.slot_id, a.booking_time, a.priority_level,
             a.status, a.scheduling_algorithm, a.state_changed_at, a.notes,
             u.first_name, u.last_name, u.email, u.phone,
             bg.group_name as blood_group,
             ds.slot_date, ds.start_time, ds.end_time, ds.location
      FROM appointments a
      JOIN donors d ON a.donor_id = d.id
      JOIN users u ON d.user_id = u.id
      JOIN blood_groups bg ON d.blood_group_id = bg.id
      JOIN donation_slots ds ON a.slot_id = ds.id
      WHERE 1=1
    `;
    const params = [];

    // Donors can only view their own appointments
    if (req.user.role === 'donor') {
      const [donorRows] = await db.execute('SELECT id FROM donors WHERE user_id = ?', [req.user.id]);
      if (donorRows.length === 0) return res.json({ success: true, data: [] });
      query += ' AND a.donor_id = ?';
      params.push(donorRows[0].id);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (slot_id) {
      query += ' AND a.slot_id = ?';
      params.push(slot_id);
    }

    query += ' ORDER BY ds.slot_date DESC, ds.start_time ASC, a.priority_level ASC';

    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve appointments', error: err.message });
  }
});

// PATCH /api/appointments/:id/status - Update appointment status (Staff/Admin)
router.patch('/:id/status', authenticate, authorize('staff', 'admin'), async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'New status is required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [appts] = await conn.execute(
      'SELECT id, status, slot_id, donor_id FROM appointments WHERE id = ? FOR UPDATE',
      [id]
    );

    if (appts.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const currentAppt = appts[0];
    const allowed = VALID_TRANSITIONS[currentAppt.status] || [];

    if (!allowed.includes(status)) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Invalid state transition from '${currentAppt.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`
      });
    }

    // If cancelled or rejected from confirmed/waiting, restore slot capacity
    if (['cancelled', 'rejected'].includes(status) && ['waiting', 'confirmed'].includes(currentAppt.status)) {
      await conn.execute(
        'UPDATE donation_slots SET available_capacity = available_capacity + 1, status = "open" WHERE id = ?',
        [currentAppt.slot_id]
      );
    }

    await conn.execute(
      'UPDATE appointments SET status = ?, state_changed_at = NOW(), notes = IFNULL(?, notes) WHERE id = ?',
      [status, notes || null, id]
    );

    await conn.commit();

    await logAudit(req.user.id, 'APPOINTMENT_STATUS_UPDATED', 'appointments', id,
      { status: currentAppt.status },
      { status, notes },
      req.ip
    );

    res.json({
      success: true,
      message: `Appointment status updated to '${status}'`,
      data: { id: parseInt(id), previous_status: currentAppt.status, current_status: status }
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating appointment status:', err);
    res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/appointments/:id - Cancel appointment (Donor or Staff/Admin)
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [appts] = await conn.execute(
      'SELECT a.id, a.status, a.slot_id, a.donor_id, d.user_id FROM appointments a JOIN donors d ON a.donor_id = d.id WHERE a.id = ? FOR UPDATE',
      [id]
    );

    if (appts.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const appt = appts[0];

    // Donors can only cancel their own appointments
    if (req.user.role === 'donor' && appt.user_id !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Cannot cancel an appointment that is not yours' });
    }

    if (['donated', 'cancelled', 'rejected'].includes(appt.status)) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: `Cannot cancel appointment with status '${appt.status}'` });
    }

    // Update appointment status to cancelled
    await conn.execute(
      'UPDATE appointments SET status = "cancelled", state_changed_at = NOW() WHERE id = ?',
      [id]
    );

    // Increment available capacity
    await conn.execute(
      'UPDATE donation_slots SET available_capacity = available_capacity + 1, status = "open" WHERE id = ?',
      [appt.slot_id]
    );

    await conn.commit();

    await logAudit(req.user.id, 'APPOINTMENT_CANCELLED', 'appointments', id,
      { status: appt.status },
      { status: 'cancelled' },
      req.ip
    );

    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel appointment', error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
