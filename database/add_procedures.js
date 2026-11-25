const mysql = require('../backend/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

async function addProcedures() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'blood_bank_system'
  });

  console.log('Adding stored procedures...');

  // Procedure 1: sp_book_appointment
  await conn.query('DROP PROCEDURE IF EXISTS sp_book_appointment');
  await conn.query(`
    CREATE PROCEDURE sp_book_appointment(
        IN p_donor_id   INT,
        IN p_slot_id    INT,
        IN p_priority   INT,
        IN p_algorithm  ENUM('FCFS','Priority','RoundRobin')
    )
    BEGIN
        DECLARE v_avail INT;
        DECLARE v_slot_status VARCHAR(20);
        DECLARE v_existing INT DEFAULT 0;
        DECLARE v_priority INT;

        SET v_priority = IFNULL(p_priority, 5);

        START TRANSACTION;

        SELECT available_capacity, status INTO v_avail, v_slot_status
        FROM donation_slots WHERE id = p_slot_id FOR UPDATE;

        IF v_avail IS NULL OR v_slot_status != 'open' OR v_avail <= 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot book: slot is full or closed.';
        END IF;

        SELECT COUNT(*) INTO v_existing FROM appointments
        WHERE donor_id = p_donor_id AND slot_id = p_slot_id;

        IF v_existing > 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Donor already has an appointment for this slot.';
        END IF;

        INSERT INTO appointments (donor_id, slot_id, booking_time, priority_level, status, scheduling_algorithm, state_changed_at, created_at, updated_at)
        VALUES (p_donor_id, p_slot_id, NOW(), v_priority, 'waiting', p_algorithm, NOW(), NOW(), NOW());

        UPDATE donation_slots
        SET available_capacity = available_capacity - 1,
            status = CASE WHEN available_capacity - 1 = 0 THEN 'full' ELSE status END
        WHERE id = p_slot_id;

        COMMIT;
        SELECT LAST_INSERT_ID() AS appointment_id, 'Appointment booked successfully.' AS message;
    END
  `);

  // Procedure 2: sp_complete_donation
  await conn.query('DROP PROCEDURE IF EXISTS sp_complete_donation');
  await conn.query(`
    CREATE PROCEDURE sp_complete_donation(
        IN p_appointment_id INT,
        IN p_staff_id       INT,
        IN p_hemoglobin     DECIMAL(4,1),
        IN p_bp             VARCHAR(20),
        IN p_temp           DECIMAL(4,1),
        IN p_notes          TEXT
    )
    BEGIN
        DECLARE v_donor_id INT;
        DECLARE v_blood_grp_id INT;
        DECLARE v_appt_status VARCHAR(20);
        DECLARE v_batch VARCHAR(50);

        START TRANSACTION;

        SELECT a.donor_id, d.blood_group_id, a.status
        INTO v_donor_id, v_blood_grp_id, v_appt_status
        FROM appointments a
        JOIN donors d ON d.id = a.donor_id
        WHERE a.id = p_appointment_id FOR UPDATE;

        IF v_donor_id IS NULL OR v_appt_status = 'donated' THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid appointment or already completed.';
        END IF;

        SET v_batch = CONCAT('BATCH-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(p_appointment_id, 5, '0'));

        UPDATE appointments SET status = 'donated', state_changed_at = NOW() WHERE id = p_appointment_id;

        INSERT INTO donation_records (appointment_id, donor_id, blood_group_id, units_donated, donation_date, hemoglobin_level, blood_pressure, temperature, staff_id, notes, created_at)
        VALUES (p_appointment_id, v_donor_id, v_blood_grp_id, 1.0, CURDATE(), p_hemoglobin, p_bp, p_temp, p_staff_id, p_notes, NOW());

        UPDATE donors SET last_donation_date = CURDATE(), total_donations = total_donations + 1, status = 'active' WHERE id = v_donor_id;

        INSERT INTO blood_inventory (blood_group_id, units_available, units_reserved, expiry_date, batch_number, status, created_at, updated_at)
        VALUES (v_blood_grp_id, 1, 0, DATE_ADD(CURDATE(), INTERVAL 42 DAY), v_batch, 'available', NOW(), NOW());

        COMMIT;
        SELECT LAST_INSERT_ID() AS inventory_id, 'Donation recorded successfully.' AS message;
    END
  `);

  console.log('Procedures created successfully!');
  await conn.end();
}

addProcedures().catch(console.error);
