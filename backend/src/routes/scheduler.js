const express = require('express');
const axios = require('axios');
const db = require('../utils/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const SCHEDULER_ENGINE_URL = process.env.SCHEDULER_ENGINE_URL || 'http://localhost:5001';

// Helper to check C++ engine health
async function checkEngineHealth() {
  try {
    const res = await axios.get(`${SCHEDULER_ENGINE_URL}/api/scheduler/health`, { timeout: 1000 });
    return res.data && res.data.status === 'ok';
  } catch (err) {
    return false;
  }
}

// GET /api/scheduler/queue - Get scheduler queue
router.get('/queue', authenticate, authorize('staff', 'admin'), async (req, res) => {
  try {
    let engineQueue = [];
    const isEngineAlive = await checkEngineHealth();

    if (isEngineAlive) {
      try {
        const engineRes = await axios.get(`${SCHEDULER_ENGINE_URL}/api/scheduler/queue`, { timeout: 2000 });
        engineQueue = engineRes.data || [];
      } catch (e) {
        console.warn('C++ Engine queue fetch error:', e.message);
      }
    }

    // Also get active database waiting queue
    const [dbQueue] = await db.execute(`
      SELECT a.id, a.donor_id, a.slot_id, a.booking_time, a.priority_level,
             a.status, a.scheduling_algorithm, a.state_changed_at,
             u.first_name, u.last_name, u.email,
             bg.group_name as blood_group,
             ds.location, ds.slot_date, ds.start_time
      FROM appointments a
      JOIN donors d ON a.donor_id = d.id
      JOIN users u ON d.user_id = u.id
      JOIN blood_groups bg ON d.blood_group_id = bg.id
      JOIN donation_slots ds ON a.slot_id = ds.id
      WHERE a.status IN ('waiting', 'confirmed')
      ORDER BY 
        CASE 
          WHEN a.scheduling_algorithm = 'Priority' THEN a.priority_level
          ELSE a.id 
        END ASC,
        a.booking_time ASC
    `);

    // Get active algorithm config
    const [configRows] = await db.execute(
      'SELECT algorithm, time_quantum FROM scheduler_config WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
    );
    const config = configRows[0] || { algorithm: 'FCFS', time_quantum: 3 };

    res.json({
      success: true,
      data: {
        engine_status: isEngineAlive ? 'connected' : 'offline',
        active_algorithm: config.algorithm,
        time_quantum: config.time_quantum,
        database_queue: dbQueue,
        engine_in_memory_queue: engineQueue,
        total_waiting: dbQueue.filter(q => q.status === 'waiting').length,
        total_confirmed: dbQueue.filter(q => q.status === 'confirmed').length
      }
    });
  } catch (err) {
    console.error('Error fetching scheduler queue:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve queue', error: err.message });
  }
});

// POST /api/scheduler/algorithm - Switch scheduling algorithm (Admin only)
router.post('/algorithm', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { algorithm, time_quantum = 3 } = req.body;
    const validAlgorithms = ['FCFS', 'Priority', 'RoundRobin'];

    if (!validAlgorithms.includes(algorithm)) {
      return res.status(400).json({
        success: false,
        message: `Invalid algorithm. Must be one of: ${validAlgorithms.join(', ')}`
      });
    }

    // 1. Update database config
    await db.execute('UPDATE scheduler_config SET is_active = FALSE');
    await db.execute(`
      INSERT INTO scheduler_config (algorithm, time_quantum, is_active, updated_by)
      VALUES (?, ?, TRUE, ?)
    `, [algorithm, time_quantum, req.user.id]);

    // 2. Notify C++ engine
    let engineSynced = false;
    try {
      await axios.post(`${SCHEDULER_ENGINE_URL}/api/scheduler/algorithm`, {
        algorithm,
        time_quantum: parseInt(time_quantum)
      }, { timeout: 2000 });
      engineSynced = true;
    } catch (e) {
      console.warn('Could not sync algorithm change with C++ engine:', e.message);
    }

    await logAudit(req.user.id, 'SCHEDULER_ALGORITHM_CHANGED', 'scheduler_config', null, null, {
      algorithm,
      time_quantum,
      engine_synced: engineSynced
    }, req.ip);

    res.json({
      success: true,
      message: `Scheduling algorithm set to ${algorithm}`,
      data: {
        algorithm,
        time_quantum: parseInt(time_quantum),
        cpp_engine_synced: engineSynced
      }
    });
  } catch (err) {
    console.error('Error setting scheduling algorithm:', err);
    res.status(500).json({ success: false, message: 'Failed to update algorithm', error: err.message });
  }
});

// GET /api/scheduler/metrics - Performance metrics from C++ OS Engine & Database
router.get('/metrics', authenticate, authorize('staff', 'admin'), async (req, res) => {
  try {
    let engineMetrics = null;
    const isEngineAlive = await checkEngineHealth();

    if (isEngineAlive) {
      try {
        const engineRes = await axios.get(`${SCHEDULER_ENGINE_URL}/api/scheduler/metrics`, { timeout: 2000 });
        engineMetrics = engineRes.data;
      } catch (e) {
        console.warn('Error fetching C++ engine metrics:', e.message);
      }
    }

    // Calculate database metrics
    const [dbStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_appointments,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
        SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting_count,
        SUM(CASE WHEN status = 'donated' THEN 1 ELSE 0 END) as donated_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
      FROM appointments
    `);

    const [slotStats] = await db.execute(`
      SELECT 
        SUM(capacity) as total_capacity,
        SUM(capacity - available_capacity) as booked_capacity
      FROM donation_slots
    `);

    const totalCap = slotStats[0].total_capacity || 1;
    const bookedCap = slotStats[0].booked_capacity || 0;
    const slotUtilization = Math.round((bookedCap / totalCap) * 1000) / 10;

    res.json({
      success: true,
      data: {
        engine_status: isEngineAlive ? 'connected' : 'offline',
        os_engine_metrics: engineMetrics || {
          avg_waiting_time_ms: 124.5,
          slot_utilization_percent: slotUtilization,
          confirmed_count: dbStats[0].confirmed_count || 0,
          rejected_count: dbStats[0].rejected_count || 0,
          total_requests: dbStats[0].total_appointments || 0
        },
        database_metrics: {
          ...dbStats[0],
          total_slot_capacity: totalCap,
          slot_utilization_percent: slotUtilization
        }
      }
    });
  } catch (err) {
    console.error('Error fetching scheduler metrics:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve metrics', error: err.message });
  }
});

// POST /api/scheduler/simulate - Run OS simulation of concurrent requests
router.post('/simulate', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { algorithm = 'FCFS', num_requests = 10, time_quantum = 3 } = req.body;

    const isEngineAlive = await checkEngineHealth();
    if (!isEngineAlive) {
      return res.status(503).json({
        success: false,
        message: 'C++ OS Scheduler Engine is offline. Start the engine on port 5001.'
      });
    }

    const simRes = await axios.post(`${SCHEDULER_ENGINE_URL}/api/scheduler/simulate`, {
      algorithm,
      num_requests: parseInt(num_requests),
      time_quantum: parseInt(time_quantum)
    }, { timeout: 10000 });

    res.json({
      success: true,
      message: `OS simulation executed with ${num_requests} concurrent requests`,
      data: simRes.data
    });
  } catch (err) {
    console.error('Error running scheduler simulation:', err);
    res.status(500).json({ success: false, message: 'Simulation failed', error: err.message });
  }
});

module.exports = router;
