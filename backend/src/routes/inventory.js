const express = require('express');
const db = require('../utils/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// GET /api/inventory - Inventory overview and batches
router.get('/', async (req, res) => {
  try {
    // 1. Group summary
    const [summary] = await db.execute(`
      SELECT bg.id, bg.group_name, bg.description,
             IFNULL(SUM(CASE WHEN bi.status = 'available' AND bi.expiry_date >= CURDATE() THEN bi.units_available ELSE 0 END), 0) as available_units,
             IFNULL(SUM(CASE WHEN bi.status = 'reserved' THEN bi.units_reserved ELSE 0 END), 0) as reserved_units,
             COUNT(CASE WHEN bi.status = 'available' AND bi.expiry_date >= CURDATE() THEN bi.id ELSE NULL END) as active_batches,
             MIN(CASE WHEN bi.status = 'available' AND bi.expiry_date >= CURDATE() THEN bi.expiry_date ELSE NULL END) as earliest_expiry
      FROM blood_groups bg
      LEFT JOIN blood_inventory bi ON bg.id = bi.blood_group_id
      GROUP BY bg.id, bg.group_name, bg.description
      ORDER BY bg.id
    `);

    // 2. Detailed batches
    const [batches] = await db.execute(`
      SELECT bi.id, bi.batch_number, bg.group_name as blood_group,
             bi.units_available, bi.units_reserved, bi.expiry_date,
             bi.status, bi.created_at,
             DATEDIFF(bi.expiry_date, CURDATE()) as days_to_expiry
      FROM blood_inventory bi
      JOIN blood_groups bg ON bi.blood_group_id = bg.id
      ORDER BY bi.expiry_date ASC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: {
        summary,
        batches,
        total_units: summary.reduce((acc, s) => acc + parseInt(s.available_units || 0), 0)
      }
    });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve inventory', error: err.message });
  }
});

// POST /api/inventory/donation - Record completed donation and update inventory (Staff/Admin)
router.post('/donation', authenticate, authorize('staff', 'admin'), async (req, res) => {
  const { appointment_id, hemoglobin_level, blood_pressure, temperature, notes } = req.body;

  if (!appointment_id) {
    return res.status(400).json({ success: false, message: 'Appointment ID is required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock appointment row
    const [appts] = await conn.execute(`
      SELECT a.id, a.donor_id, a.status, d.blood_group_id
      FROM appointments a
      JOIN donors d ON a.donor_id = d.id
      WHERE a.id = ?
      FOR UPDATE
    `, [appointment_id]);

    if (appts.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const appt = appts[0];
    if (appt.status === 'donated') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Donation has already been recorded for this appointment' });
    }

    // 2. Insert donation record
    const [recordResult] = await conn.execute(`
      INSERT INTO donation_records (
        appointment_id, donor_id, blood_group_id, units_donated,
        donation_date, hemoglobin_level, blood_pressure, temperature, staff_id, notes
      ) VALUES (?, ?, ?, 1.0, CURDATE(), ?, ?, ?, ?, ?)
    `, [
      appointment_id, appt.donor_id, appt.blood_group_id,
      hemoglobin_level || null, blood_pressure || null, temperature || null,
      req.user.id, notes || null
    ]);

    const recordId = recordResult.insertId;

    // 3. Update appointment status to 'donated'
    await conn.execute(`
      UPDATE appointments
      SET status = 'donated', state_changed_at = NOW()
      WHERE id = ?
    `, [appointment_id]);

    // 4. Update donor profile (increment total_donations, update last_donation_date)
    await conn.execute(`
      UPDATE donors
      SET total_donations = total_donations + 1,
          last_donation_date = CURDATE(),
          status = 'active'
      WHERE id = ?
    `, [appt.donor_id]);

    // 5. Add unit to blood_inventory (shelf life: 42 days for red blood cells)
    const batchNumber = `BATCH-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${String(recordId).padStart(5, '0')}`;
    const [invResult] = await conn.execute(`
      INSERT INTO blood_inventory (blood_group_id, batch_number, units_available, units_reserved, expiry_date, status)
      VALUES (?, ?, 1, 0, DATE_ADD(CURDATE(), INTERVAL 42 DAY), 'available')
    `, [appt.blood_group_id, batchNumber]);

    await conn.commit();

    await logAudit(req.user.id, 'DONATION_COMPLETED', 'donation_records', recordId, null, {
      appointment_id,
      donor_id: appt.donor_id,
      batch_number: batchNumber,
      units: 1.0
    }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Donation recorded and blood unit added to inventory!',
      data: {
        record_id: recordId,
        batch_number: batchNumber,
        inventory_id: invResult.insertId,
        units_added: 1.0
      }
    });

  } catch (err) {
    await conn.rollback();
    console.error('Error completing donation:', err);
    res.status(500).json({ success: false, message: 'Failed to record donation', error: err.message });
  } finally {
    conn.release();
  }
});

// POST /api/inventory/fulfilment - Fulfill blood request from inventory
router.post('/fulfilment', authenticate, authorize('staff', 'admin'), async (req, res) => {
  const { request_id, notes } = req.body;

  if (!request_id) {
    return res.status(400).json({ success: false, message: 'Request ID is required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock the blood request row
    const [reqs] = await conn.execute(`
      SELECT id, blood_group_id, units_requested, status
      FROM blood_requests
      WHERE id = ?
      FOR UPDATE
    `, [request_id]);

    if (reqs.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    const request = reqs[0];
    if (!['pending', 'approved', 'partially_fulfilled'].includes(request.status)) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: `Cannot fulfill request with status '${request.status}'` });
    }

    // 2. Check already fulfilled units
    const [fulfilledSum] = await conn.execute(
      'SELECT IFNULL(SUM(units_fulfilled), 0) as already_fulfilled FROM request_fulfilments WHERE request_id = ?',
      [request_id]
    );
    const needed = request.units_requested - fulfilledSum[0].already_fulfilled;

    if (needed <= 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Request is already fully fulfilled' });
    }

    // 3. Find available batches for this blood group, ordered by earliest expiry (FIFO)
    const [batches] = await conn.execute(`
      SELECT id, units_available, batch_number
      FROM blood_inventory
      WHERE blood_group_id = ? AND status = 'available' AND units_available > 0 AND expiry_date >= CURDATE()
      ORDER BY expiry_date ASC
      FOR UPDATE
    `, [request.blood_group_id]);

    const totalAvailable = batches.reduce((sum, b) => sum + b.units_available, 0);
    if (totalAvailable === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'No available stock for this blood group' });
    }

    let remainingNeeded = needed;
    let totalFulfilledThisTime = 0;

    for (const batch of batches) {
      if (remainingNeeded <= 0) break;

      const take = Math.min(batch.units_available, remainingNeeded);
      const newAvail = batch.units_available - take;
      const newStatus = newAvail === 0 ? 'used' : 'available';

      // Update inventory batch
      await conn.execute(
        'UPDATE blood_inventory SET units_available = ?, status = ? WHERE id = ?',
        [newAvail, newStatus, batch.id]
      );

      // Record fulfilment join
      await conn.execute(`
        INSERT INTO request_fulfilments (request_id, inventory_id, units_fulfilled, fulfilled_by, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [request_id, batch.id, take, req.user.id, notes || null]);

      remainingNeeded -= take;
      totalFulfilledThisTime += take;
    }

    const finalStatus = remainingNeeded === 0 ? 'fulfilled' : 'partially_fulfilled';
    await conn.execute(`
      UPDATE blood_requests
      SET status = ?, fulfilled_date = CASE WHEN ? = 'fulfilled' THEN CURDATE() ELSE fulfilled_date END
      WHERE id = ?
    `, [finalStatus, finalStatus, request_id]);

    await conn.commit();

    await logAudit(req.user.id, 'REQUEST_FULFILLED', 'blood_requests', request_id,
      { status: request.status },
      { status: finalStatus, units_fulfilled: totalFulfilledThisTime },
      req.ip
    );

    res.json({
      success: true,
      message: finalStatus === 'fulfilled' ? 'Request fully fulfilled!' : `Partially fulfilled (${totalFulfilledThisTime} units dispatched)`,
      data: {
        request_id,
        status: finalStatus,
        units_fulfilled: totalFulfilledThisTime,
        units_remaining: remainingNeeded
      }
    });

  } catch (err) {
    await conn.rollback();
    console.error('Error fulfilling request:', err);
    res.status(500).json({ success: false, message: 'Failed to fulfill request', error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
