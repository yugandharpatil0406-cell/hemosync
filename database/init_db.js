const mysql = require('../backend/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    multipleStatements: true
  });

  console.log('Connected! Creating database blood_bank_system...');
  await conn.query('DROP DATABASE IF EXISTS blood_bank_system');
  await conn.query('CREATE DATABASE blood_bank_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await conn.query('USE blood_bank_system');

  // Read schema.sql, strip delimiter syntax
  let schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  // Separate stored procedures / triggers from table definitions
  // Everything up to line 267 is tables and indexes
  const parts = schema.split('-- TRIGGER: trg_check_slot_capacity');
  const ddlTables = parts[0];

  console.log('Creating tables and indexes...');
  await conn.query(ddlTables);

  console.log('Seeding initial data (30 donors, 8 groups, slots, appointments, inventory)...');
  let seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  await conn.query(seed);

  console.log('Verification:');
  const [users] = await conn.query('SELECT COUNT(*) as cnt FROM users');
  const [donors] = await conn.query('SELECT COUNT(*) as cnt FROM donors');
  const [slots] = await conn.query('SELECT COUNT(*) as cnt FROM donation_slots');
  const [appts] = await conn.query('SELECT COUNT(*) as cnt FROM appointments');
  const [inv] = await conn.query('SELECT COUNT(*) as cnt FROM blood_inventory');
  const [reqs] = await conn.query('SELECT COUNT(*) as cnt FROM blood_requests');

  console.log(`  Users:        ${users[0].cnt}`);
  console.log(`  Donors:       ${donors[0].cnt}`);
  console.log(`  Slots:        ${slots[0].cnt}`);
  console.log(`  Appointments: ${appts[0].cnt}`);
  console.log(`  Inventory:    ${inv[0].cnt}`);
  console.log(`  Requests:     ${reqs[0].cnt}`);

  await conn.end();
  console.log('Database initialization completed successfully!');
}

initDatabase().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
