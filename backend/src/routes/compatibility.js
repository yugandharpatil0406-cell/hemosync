const express = require('express');
const axios = require('axios');
const db = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const COMPATIBILITY_ENGINE_URL = process.env.COMPATIBILITY_ENGINE_URL || 'http://localhost:5002';

// Standard Red Blood Cell (RBC) compatibility table as fallback if engine is unreachable
const RBC_COMPATIBLE_DONORS = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-']
};

const RBC_CAN_DONATE_TO = {
  'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'O+': ['A+', 'B+', 'AB+', 'O+'],
  'A-': ['A+', 'A-', 'AB+', 'AB-'],
  'A+': ['A+', 'AB+'],
  'B-': ['B+', 'B-', 'AB+', 'AB-'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB+', 'AB-'],
  'AB+': ['AB+']
};

// Helper: check C++ DSA engine
async function checkEngineHealth() {
  try {
    const res = await axios.get(`${COMPATIBILITY_ENGINE_URL}/api/compatibility/health`, { timeout: 1000 });
    return res.data && res.data.status === 'ok';
  } catch (err) {
    return false;
  }
}

// POST /api/compatibility/check - Check compatibility between two blood groups
router.post('/check', async (req, res) => {
  try {
    const { donor_blood_group, recipient_blood_group } = req.body;

    if (!donor_blood_group || !recipient_blood_group) {
      return res.status(400).json({ success: false, message: 'Both donor and recipient blood groups are required' });
    }

    const isEngineAlive = await checkEngineHealth();

    if (isEngineAlive) {
      const engineRes = await axios.post(`${COMPATIBILITY_ENGINE_URL}/api/compatibility/check`, {
        donor_blood_group,
        recipient_blood_group
      }, { timeout: 2000 });

      return res.json({
        ...engineRes.data,
        engine_source: 'C++ DSA Directed Graph Engine'
      });
    }

    // Fallback using graph logic
    const compatible = (RBC_CAN_DONATE_TO[donor_blood_group] || []).includes(recipient_blood_group);

    res.json({
      success: true,
      donor_blood_group,
      recipient_blood_group,
      compatible,
      rule: 'Red Blood Cell (RBC) ABO & Rh Compatibility',
      can_receive_from: RBC_CAN_DONATE_TO[donor_blood_group] || [],
      engine_source: 'Fallback Rule Engine'
    });
  } catch (err) {
    console.error('Error checking compatibility:', err);
    res.status(500).json({ success: false, message: 'Compatibility check failed', error: err.message });
  }
});

// GET /api/compatibility/donors - Get compatible donors and stock for a recipient
router.get('/donors', async (req, res) => {
  try {
    const { blood_group } = req.query;

    if (!blood_group) {
      return res.status(400).json({ success: false, message: 'Recipient blood_group is required' });
    }

    let compatibleGroups = RBC_COMPATIBLE_DONORS[blood_group] || [];
    const isEngineAlive = await checkEngineHealth();

    if (isEngineAlive) {
      try {
        const engineRes = await axios.get(
          `${COMPATIBILITY_ENGINE_URL}/api/compatibility/donors?blood_group=${encodeURIComponent(blood_group)}&available_only=true`,
          { timeout: 2000 }
        );
        if (engineRes.data && engineRes.data.compatible_blood_groups) {
          compatibleGroups = engineRes.data.compatible_blood_groups;
        }
      } catch (e) {
        console.warn('Engine fetch failed, using built-in table:', e.message);
      }
    }

    // Query MySQL database for available inventory units of compatible blood groups
    const [inventoryRows] = await db.query(`
      SELECT bg.group_name,
             IFNULL(SUM(bi.units_available), 0) as units_available,
             COUNT(bi.id) as batch_count
      FROM blood_groups bg
      LEFT JOIN blood_inventory bi ON bi.blood_group_id = bg.id AND bi.status = 'available' AND bi.expiry_date >= CURDATE()
      WHERE bg.group_name IN (?)
      GROUP BY bg.group_name
      ORDER BY FIELD(bg.group_name, ?)
    `, [compatibleGroups, compatibleGroups]);

    // Query MySQL database for registered active donors with compatible blood groups
    const [donorsRows] = await db.query(`
      SELECT d.id, u.first_name, u.last_name, u.phone,
             bg.group_name as blood_group, d.status, d.last_donation_date, d.total_donations
      FROM donors d
      JOIN users u ON d.user_id = u.id
      JOIN blood_groups bg ON d.blood_group_id = bg.id
      WHERE bg.group_name IN (?) AND d.status = 'active'
      LIMIT 15
    `, [compatibleGroups]);

    res.json({
      success: true,
      recipient_blood_group: blood_group,
      compatible_blood_groups: compatibleGroups,
      available_inventory: inventoryRows,
      available_donors: donorsRows,
      total_compatible_units: inventoryRows.reduce((sum, r) => sum + parseInt(r.units_available || 0), 0),
      dsa_engine_connected: isEngineAlive
    });
  } catch (err) {
    console.error('Error finding compatible donors:', err);
    res.status(500).json({ success: false, message: 'Failed to find compatible donors', error: err.message });
  }
});

// GET /api/compatibility/graph - Directed compatibility graph for visualization
router.get('/graph', async (req, res) => {
  try {
    const isEngineAlive = await checkEngineHealth();

    if (isEngineAlive) {
      const engineRes = await axios.get(`${COMPATIBILITY_ENGINE_URL}/api/compatibility/graph`, { timeout: 2000 });
      return res.json({
        ...engineRes.data,
        source: 'C++ DSA Directed Graph (8 Nodes, 27 Directed Edges)'
      });
    }

    // Fallback graph
    const nodes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const edges = [];
    for (const [from, toList] of Object.entries(RBC_CAN_DONATE_TO)) {
      for (const to of toList) {
        edges.push({ from, to });
      }
    }

    res.json({
      success: true,
      nodes,
      edges,
      source: 'Internal Graph Schema'
    });
  } catch (err) {
    console.error('Error fetching compatibility graph:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve graph', error: err.message });
  }
});

// GET /api/compatibility/traversal - BFS / DFS traversal
router.get('/traversal', async (req, res) => {
  try {
    const { type = 'bfs', start = 'O-' } = req.query;
    const isEngineAlive = await checkEngineHealth();

    if (isEngineAlive) {
      const endpoint = type.toLowerCase() === 'dfs' ? 'dfs' : 'bfs';
      const engineRes = await axios.get(
        `${COMPATIBILITY_ENGINE_URL}/api/compatibility/${endpoint}?start=${encodeURIComponent(start)}`,
        { timeout: 2000 }
      );
      return res.json(engineRes.data);
    }

    res.json({
      success: true,
      algorithm: type.toUpperCase(),
      start_node: start,
      traversal_order: RBC_CAN_DONATE_TO[start] || [start],
      note: 'Graph reachability traversal'
    });
  } catch (err) {
    console.error('Error performing graph traversal:', err);
    res.status(500).json({ success: false, message: 'Traversal failed', error: err.message });
  }
});

module.exports = router;
