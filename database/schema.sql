-- ============================================================================
-- Blood Bank and Donor Slot Management System
-- Database Schema
-- MySQL 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS blood_bank_system
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE blood_bank_system;

-- ============================================================================
-- TABLE: blood_groups
-- Reference table for all ABO/Rh blood group types.
-- ============================================================================
CREATE TABLE blood_groups (
    id          INT           AUTO_INCREMENT PRIMARY KEY,
    group_name  VARCHAR(5)    NOT NULL UNIQUE,
    description VARCHAR(255)  NULL
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: users
-- Central authentication / identity table for every person in the system.
-- ============================================================================
CREATE TABLE users (
    id            INT            AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255)   NOT NULL,
    password_hash VARCHAR(255)   NOT NULL,
    role          ENUM('donor','staff','admin','requester') NOT NULL,
    first_name    VARCHAR(100)   NOT NULL,
    last_name     VARCHAR(100)   NOT NULL,
    phone         VARCHAR(20)    NULL,
    is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: donors
-- Extended profile for users whose role = 'donor'.
-- ============================================================================
CREATE TABLE donors (
    id                 INT           AUTO_INCREMENT PRIMARY KEY,
    user_id            INT           NOT NULL,
    blood_group_id     INT           NOT NULL,
    date_of_birth      DATE          NOT NULL,
    gender             ENUM('male','female','other') NOT NULL,
    address            TEXT          NULL,
    medical_notes      TEXT          NULL,
    last_donation_date DATE          NULL,
    total_donations    INT           NOT NULL DEFAULT 0,
    status             ENUM('registered','active','inactive','deferred') NOT NULL DEFAULT 'registered',
    created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_donors_user       FOREIGN KEY (user_id)        REFERENCES users(id)        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_donors_blood_grp  FOREIGN KEY (blood_group_id) REFERENCES blood_groups(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_donors_user       UNIQUE (user_id),
    CONSTRAINT chk_donors_total_donations CHECK (total_donations >= 0)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: donation_slots
-- Time-bounded capacity slots at specific locations.
-- ============================================================================
CREATE TABLE donation_slots (
    id                 INT           AUTO_INCREMENT PRIMARY KEY,
    slot_date          DATE          NOT NULL,
    start_time         TIME          NOT NULL,
    end_time           TIME          NOT NULL,
    location           VARCHAR(255)  NOT NULL,
    capacity           INT           NOT NULL,
    available_capacity INT           NOT NULL,
    status             ENUM('open','full','closed','cancelled') NOT NULL DEFAULT 'open',
    created_by         INT           NOT NULL,
    created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_slots_created_by  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_slots_capacity   CHECK (capacity > 0),
    CONSTRAINT chk_slots_avail_cap  CHECK (available_capacity >= 0),
    CONSTRAINT chk_slots_times      CHECK (end_time > start_time)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: appointments
-- Links a donor to a donation slot; tracks scheduling algorithm used.
-- ============================================================================
CREATE TABLE appointments (
    id                   INT           AUTO_INCREMENT PRIMARY KEY,
    donor_id             INT           NOT NULL,
    slot_id              INT           NOT NULL,
    booking_time         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    priority_level       INT           NOT NULL DEFAULT 5,
    status               ENUM('waiting','confirmed','donated','cancelled','rejected','no_show') NOT NULL DEFAULT 'waiting',
    scheduling_algorithm ENUM('FCFS','Priority','RoundRobin') NOT NULL DEFAULT 'FCFS',
    state_changed_at     DATETIME      NULL,
    notes                TEXT          NULL,
    created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_appt_donor  FOREIGN KEY (donor_id) REFERENCES donors(id)         ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_appt_slot   FOREIGN KEY (slot_id)  REFERENCES donation_slots(id)  ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_appt_donor_slot UNIQUE (donor_id, slot_id),
    CONSTRAINT chk_appt_priority  CHECK (priority_level BETWEEN 1 AND 10)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: donation_records
-- Actual donation event with vitals captured by staff.
-- ============================================================================
CREATE TABLE donation_records (
    id               INT            AUTO_INCREMENT PRIMARY KEY,
    appointment_id   INT            NOT NULL,
    donor_id         INT            NOT NULL,
    blood_group_id   INT            NOT NULL,
    units_donated    DECIMAL(3,1)   NOT NULL DEFAULT 1.0,
    donation_date    DATE           NOT NULL,
    hemoglobin_level DECIMAL(4,1)   NULL,
    blood_pressure   VARCHAR(20)    NULL,
    temperature      DECIMAL(4,1)   NULL,
    staff_id         INT            NOT NULL,
    notes            TEXT           NULL,
    created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_donrec_appt      FOREIGN KEY (appointment_id) REFERENCES appointments(id)  ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_donrec_donor     FOREIGN KEY (donor_id)       REFERENCES donors(id)         ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_donrec_bg        FOREIGN KEY (blood_group_id) REFERENCES blood_groups(id)   ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_donrec_staff     FOREIGN KEY (staff_id)       REFERENCES users(id)          ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_donrec_appt      UNIQUE (appointment_id),
    CONSTRAINT chk_donrec_units    CHECK (units_donated > 0),
    CONSTRAINT chk_donrec_hemo     CHECK (hemoglobin_level IS NULL OR hemoglobin_level > 0),
    CONSTRAINT chk_donrec_temp     CHECK (temperature IS NULL OR temperature > 0)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: blood_inventory
-- Tracks physical blood unit batches with expiry and reservation status.
-- ============================================================================
CREATE TABLE blood_inventory (
    id              INT           AUTO_INCREMENT PRIMARY KEY,
    blood_group_id  INT           NOT NULL,
    units_available INT           NOT NULL DEFAULT 0,
    units_reserved  INT           NOT NULL DEFAULT 0,
    last_updated    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expiry_date     DATE          NOT NULL,
    batch_number    VARCHAR(50)   NOT NULL,
    status          ENUM('available','reserved','expired','used') NOT NULL DEFAULT 'available',
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_inv_bg            FOREIGN KEY (blood_group_id) REFERENCES blood_groups(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_inv_units_avail  CHECK (units_available >= 0),
    CONSTRAINT chk_inv_units_resv   CHECK (units_reserved  >= 0)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: blood_requests
-- Hospital / requester demand for blood of a specific group.
-- ============================================================================
CREATE TABLE blood_requests (
    id              INT           AUTO_INCREMENT PRIMARY KEY,
    requester_id    INT           NOT NULL,
    blood_group_id  INT           NOT NULL,
    units_requested INT           NOT NULL,
    urgency         ENUM('normal','urgent','critical') NOT NULL DEFAULT 'normal',
    patient_name    VARCHAR(200)  NULL,
    hospital_name   VARCHAR(255)  NULL,
    reason          TEXT          NULL,
    status          ENUM('pending','approved','fulfilled','partially_fulfilled','rejected','cancelled') NOT NULL DEFAULT 'pending',
    request_date    DATE          NOT NULL,
    fulfilled_date  DATE          NULL,
    notes           TEXT          NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_req_requester   FOREIGN KEY (requester_id)   REFERENCES users(id)        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_req_bg          FOREIGN KEY (blood_group_id) REFERENCES blood_groups(id)  ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_req_units      CHECK (units_requested > 0)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: request_fulfilments
-- Join table recording which inventory batches satisfied which requests.
-- ============================================================================
CREATE TABLE request_fulfilments (
    id             INT        AUTO_INCREMENT PRIMARY KEY,
    request_id     INT        NOT NULL,
    inventory_id   INT        NOT NULL,
    units_fulfilled INT       NOT NULL,
    fulfilled_by   INT        NOT NULL,
    fulfilled_at   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes          TEXT       NULL,

    CONSTRAINT fk_rf_request   FOREIGN KEY (request_id)   REFERENCES blood_requests(id)  ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_rf_inventory FOREIGN KEY (inventory_id)  REFERENCES blood_inventory(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_rf_staff     FOREIGN KEY (fulfilled_by)  REFERENCES users(id)           ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_rf_units    CHECK (units_fulfilled > 0)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: audit_logs
-- Immutable append-only log for compliance and debugging.
-- ============================================================================
CREATE TABLE audit_logs (
    id          INT            AUTO_INCREMENT PRIMARY KEY,
    user_id     INT            NULL,
    action      VARCHAR(100)   NOT NULL,
    entity_type VARCHAR(50)    NOT NULL,
    entity_id   INT            NULL,
    old_values  JSON           NULL,
    new_values  JSON           NULL,
    ip_address  VARCHAR(45)    NULL,
    created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE: scheduler_config
-- System-level configuration for the appointment scheduling algorithm.
-- ============================================================================
CREATE TABLE scheduler_config (
    id           INT           AUTO_INCREMENT PRIMARY KEY,
    algorithm    ENUM('FCFS','Priority','RoundRobin') NOT NULL DEFAULT 'FCFS',
    time_quantum INT           NOT NULL DEFAULT 3,
    is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
    updated_by   INT           NULL,
    updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_sched_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_sched_tq  CHECK (time_quantum > 0)
) ENGINE=InnoDB;


-- ============================================================================
-- INDEXES
-- ============================================================================

-- users
CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_role        ON users(role);

-- donors
CREATE INDEX idx_donors_blood_grp  ON donors(blood_group_id);

-- appointments
CREATE INDEX idx_appt_status       ON appointments(status);
CREATE INDEX idx_appt_slot         ON appointments(slot_id);

-- blood_inventory
CREATE INDEX idx_inv_blood_grp     ON blood_inventory(blood_group_id);

-- blood_requests
CREATE INDEX idx_req_status        ON blood_requests(status);

-- audit_logs
CREATE INDEX idx_audit_created     ON audit_logs(created_at);

-- donation_slots
CREATE INDEX idx_slots_date        ON donation_slots(slot_date);


-- ============================================================================
-- TRIGGER: trg_check_slot_capacity
-- Before inserting an appointment, ensure the slot still has room.
-- ============================================================================
DELIMITER $$

CREATE TRIGGER trg_check_slot_capacity
BEFORE INSERT ON appointments
FOR EACH ROW
BEGIN
    DECLARE v_avail INT;
    DECLARE v_slot_status VARCHAR(20);

    SELECT available_capacity, status
      INTO v_avail, v_slot_status
      FROM donation_slots
     WHERE id = NEW.slot_id;

    IF v_slot_status != 'open' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot book: slot is not open.';
    END IF;

    IF v_avail <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot book: slot has no available capacity.';
    END IF;
END$$

-- ============================================================================
-- TRIGGER: trg_after_appointment_insert
-- Log new appointment creation to audit_logs.
-- ============================================================================
CREATE TRIGGER trg_after_appointment_insert
AFTER INSERT ON appointments
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at)
    VALUES (
        NULL,
        'APPOINTMENT_CREATED',
        'appointment',
        NEW.id,
        JSON_OBJECT(
            'donor_id',             NEW.donor_id,
            'slot_id',              NEW.slot_id,
            'status',               NEW.status,
            'priority_level',       NEW.priority_level,
            'scheduling_algorithm', NEW.scheduling_algorithm
        ),
        NOW()
    );
END$$

-- ============================================================================
-- TRIGGER: trg_after_appointment_update
-- Log appointment status changes to audit_logs.
-- ============================================================================
CREATE TRIGGER trg_after_appointment_update
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, created_at)
        VALUES (
            NULL,
            'APPOINTMENT_STATUS_CHANGED',
            'appointment',
            NEW.id,
            JSON_OBJECT(
                'status',           OLD.status,
                'priority_level',   OLD.priority_level
            ),
            JSON_OBJECT(
                'status',           NEW.status,
                'priority_level',   NEW.priority_level,
                'state_changed_at', IFNULL(CAST(NEW.state_changed_at AS CHAR), 'NULL')
            ),
            NOW()
        );
    END IF;
END$$

-- ============================================================================
-- TRIGGER: trg_after_inventory_update
-- Log inventory changes to audit_logs.
-- ============================================================================
CREATE TRIGGER trg_after_inventory_update
AFTER UPDATE ON blood_inventory
FOR EACH ROW
BEGIN
    IF OLD.units_available != NEW.units_available
       OR OLD.units_reserved != NEW.units_reserved
       OR OLD.status != NEW.status THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, created_at)
        VALUES (
            NULL,
            'INVENTORY_UPDATED',
            'blood_inventory',
            NEW.id,
            JSON_OBJECT(
                'units_available', OLD.units_available,
                'units_reserved',  OLD.units_reserved,
                'status',          OLD.status
            ),
            JSON_OBJECT(
                'units_available', NEW.units_available,
                'units_reserved',  NEW.units_reserved,
                'status',          NEW.status
            ),
            NOW()
        );
    END IF;
END$$


-- ============================================================================
-- STORED PROCEDURE: sp_book_appointment
-- Books an appointment with row-level locking, capacity check, and
-- double-booking prevention.
-- ============================================================================
CREATE PROCEDURE sp_book_appointment(
    IN p_donor_id   INT,
    IN p_slot_id    INT,
    IN p_priority   INT,
    IN p_algorithm  ENUM('FCFS','Priority','RoundRobin')
)
BEGIN
    DECLARE v_avail        INT;
    DECLARE v_slot_status  VARCHAR(20);
    DECLARE v_existing     INT DEFAULT 0;
    DECLARE v_priority     INT;

    -- Default priority
    SET v_priority = IFNULL(p_priority, 5);

    -- Validate priority range
    IF v_priority < 1 OR v_priority > 10 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Priority level must be between 1 and 10.';
    END IF;

    START TRANSACTION;

    -- Row-level lock on the slot row
    SELECT available_capacity, status
      INTO v_avail, v_slot_status
      FROM donation_slots
     WHERE id = p_slot_id
       FOR UPDATE;

    -- Slot must exist
    IF v_avail IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Slot does not exist.';
    END IF;

    -- Slot must be open
    IF v_slot_status != 'open' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot book: slot is not open.';
    END IF;

    -- Must have capacity
    IF v_avail <= 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot book: slot is full.';
    END IF;

    -- Double-booking check
    SELECT COUNT(*) INTO v_existing
      FROM appointments
     WHERE donor_id = p_donor_id
       AND slot_id  = p_slot_id;

    IF v_existing > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Donor already has an appointment for this slot.';
    END IF;

    -- Insert appointment
    INSERT INTO appointments (donor_id, slot_id, booking_time, priority_level, status, scheduling_algorithm, state_changed_at, created_at, updated_at)
    VALUES (p_donor_id, p_slot_id, NOW(), v_priority, 'waiting', p_algorithm, NOW(), NOW(), NOW());

    -- Decrement available capacity
    UPDATE donation_slots
       SET available_capacity = available_capacity - 1,
           status = CASE WHEN available_capacity - 1 = 0 THEN 'full' ELSE status END,
           updated_at = NOW()
     WHERE id = p_slot_id;

    COMMIT;

    SELECT LAST_INSERT_ID() AS appointment_id, 'Appointment booked successfully.' AS message;
END$$


-- ============================================================================
-- STORED PROCEDURE: sp_complete_donation
-- Records a completed donation, updates appointment status, adds inventory.
-- ============================================================================
CREATE PROCEDURE sp_complete_donation(
    IN p_appointment_id INT,
    IN p_staff_id       INT,
    IN p_hemoglobin     DECIMAL(4,1),
    IN p_bp             VARCHAR(20),
    IN p_temp           DECIMAL(4,1),
    IN p_notes          TEXT
)
BEGIN
    DECLARE v_donor_id      INT;
    DECLARE v_blood_grp_id  INT;
    DECLARE v_appt_status   VARCHAR(20);
    DECLARE v_batch         VARCHAR(50);

    START TRANSACTION;

    -- Lock appointment row
    SELECT a.donor_id, d.blood_group_id, a.status
      INTO v_donor_id, v_blood_grp_id, v_appt_status
      FROM appointments a
      JOIN donors d ON d.id = a.donor_id
     WHERE a.id = p_appointment_id
       FOR UPDATE;

    IF v_donor_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Appointment not found.';
    END IF;

    IF v_appt_status NOT IN ('waiting', 'confirmed') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Appointment is not in a bookable state for donation.';
    END IF;

    -- Generate a batch number
    SET v_batch = CONCAT('BATCH-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(p_appointment_id, 5, '0'));

    -- Update appointment to donated
    UPDATE appointments
       SET status = 'donated',
           state_changed_at = NOW(),
           updated_at = NOW()
     WHERE id = p_appointment_id;

    -- Create donation record
    INSERT INTO donation_records (appointment_id, donor_id, blood_group_id, units_donated, donation_date, hemoglobin_level, blood_pressure, temperature, staff_id, notes, created_at)
    VALUES (p_appointment_id, v_donor_id, v_blood_grp_id, 1.0, CURDATE(), p_hemoglobin, p_bp, p_temp, p_staff_id, p_notes, NOW());

    -- Update donor stats
    UPDATE donors
       SET last_donation_date = CURDATE(),
           total_donations    = total_donations + 1,
           status             = 'active',
           updated_at         = NOW()
     WHERE id = v_donor_id;

    -- Add to blood inventory (new batch, expires 42 days from now)
    INSERT INTO blood_inventory (blood_group_id, units_available, units_reserved, expiry_date, batch_number, status, created_at, updated_at)
    VALUES (v_blood_grp_id, 1, 0, DATE_ADD(CURDATE(), INTERVAL 42 DAY), v_batch, 'available', NOW(), NOW());

    COMMIT;

    SELECT LAST_INSERT_ID() AS inventory_id, 'Donation recorded successfully.' AS message;
END$$


-- ============================================================================
-- STORED PROCEDURE: sp_fulfill_request
-- Fulfills a blood request from available inventory batches (FIFO by expiry).
-- ============================================================================
CREATE PROCEDURE sp_fulfill_request(
    IN p_request_id   INT,
    IN p_fulfilled_by INT,
    IN p_notes        TEXT
)
BEGIN
    DECLARE v_blood_grp    INT;
    DECLARE v_needed       INT;
    DECLARE v_req_status   VARCHAR(30);
    DECLARE v_inv_id       INT;
    DECLARE v_inv_avail    INT;
    DECLARE v_take         INT;
    DECLARE v_total_filled INT DEFAULT 0;
    DECLARE v_done         INT DEFAULT 0;
    DECLARE v_units_req    INT;

    -- Cursor: available inventory rows for the required blood group, soonest-expiry first
    DECLARE cur_inv CURSOR FOR
        SELECT id, units_available
          FROM blood_inventory
         WHERE blood_group_id = v_blood_grp
           AND status = 'available'
           AND units_available > 0
           AND expiry_date > CURDATE()
         ORDER BY expiry_date ASC
           FOR UPDATE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    START TRANSACTION;

    -- Lock the request row
    SELECT blood_group_id, units_requested, status
      INTO v_blood_grp, v_units_req, v_req_status
      FROM blood_requests
     WHERE id = p_request_id
       FOR UPDATE;

    IF v_blood_grp IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Blood request not found.';
    END IF;

    IF v_req_status NOT IN ('pending', 'approved', 'partially_fulfilled') THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Request is not in a fulfillable state.';
    END IF;

    -- Calculate how many units still needed (subtract already-fulfilled)
    SELECT IFNULL(SUM(units_fulfilled), 0) INTO v_total_filled
      FROM request_fulfilments
     WHERE request_id = p_request_id;

    SET v_needed = v_units_req - v_total_filled;

    IF v_needed <= 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Request has already been fully fulfilled.';
    END IF;

    -- Reset counter for this run
    SET v_total_filled = 0;

    OPEN cur_inv;

    inv_loop: LOOP
        FETCH cur_inv INTO v_inv_id, v_inv_avail;
        IF v_done = 1 THEN
            LEAVE inv_loop;
        END IF;

        -- Take as many as we can from this batch
        SET v_take = LEAST(v_inv_avail, v_needed);

        UPDATE blood_inventory
           SET units_available = units_available - v_take,
               status = CASE WHEN units_available - v_take = 0 THEN 'used' ELSE status END,
               updated_at = NOW()
         WHERE id = v_inv_id;

        INSERT INTO request_fulfilments (request_id, inventory_id, units_fulfilled, fulfilled_by, fulfilled_at, notes)
        VALUES (p_request_id, v_inv_id, v_take, p_fulfilled_by, NOW(), p_notes);

        SET v_total_filled = v_total_filled + v_take;
        SET v_needed = v_needed - v_take;

        IF v_needed <= 0 THEN
            LEAVE inv_loop;
        END IF;
    END LOOP;

    CLOSE cur_inv;

    -- Update request status
    IF v_total_filled = 0 THEN
        -- Nothing fulfilled — no inventory available
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient inventory to fulfil any units.';
    ELSEIF v_needed <= 0 THEN
        UPDATE blood_requests
           SET status = 'fulfilled',
               fulfilled_date = CURDATE(),
               notes = IFNULL(CONCAT(notes, '\n', p_notes), p_notes),
               updated_at = NOW()
         WHERE id = p_request_id;
    ELSE
        UPDATE blood_requests
           SET status = 'partially_fulfilled',
               notes = IFNULL(CONCAT(notes, '\n', p_notes), p_notes),
               updated_at = NOW()
         WHERE id = p_request_id;
    END IF;

    COMMIT;

    SELECT v_total_filled AS units_fulfilled,
           v_needed       AS units_remaining,
           CASE WHEN v_needed <= 0 THEN 'fulfilled' ELSE 'partially_fulfilled' END AS request_status,
           'Request processed successfully.' AS message;
END$$


-- ============================================================================
-- STORED PROCEDURE: sp_get_dashboard_stats
-- Returns aggregate statistics for the admin dashboard.
-- ============================================================================
CREATE PROCEDURE sp_get_dashboard_stats()
BEGIN
    -- 1. Total counts
    SELECT
        (SELECT COUNT(*) FROM donors)                                          AS total_donors,
        (SELECT COUNT(*) FROM donors WHERE status = 'active')                  AS active_donors,
        (SELECT COUNT(*) FROM appointments WHERE status = 'waiting')           AS pending_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'donated')           AS completed_donations,
        (SELECT IFNULL(SUM(units_available), 0) FROM blood_inventory
            WHERE status = 'available' AND expiry_date > CURDATE())            AS total_units_available,
        (SELECT COUNT(*) FROM blood_requests WHERE status = 'pending')         AS pending_requests,
        (SELECT COUNT(*) FROM blood_requests WHERE status = 'fulfilled')       AS fulfilled_requests,
        (SELECT COUNT(*) FROM donation_slots WHERE slot_date >= CURDATE()
            AND status = 'open')                                               AS upcoming_open_slots;

    -- 2. Inventory by blood group
    SELECT
        bg.group_name,
        IFNULL(SUM(CASE WHEN bi.status = 'available' AND bi.expiry_date > CURDATE() THEN bi.units_available ELSE 0 END), 0) AS units_available,
        IFNULL(SUM(bi.units_reserved), 0) AS units_reserved
      FROM blood_groups bg
      LEFT JOIN blood_inventory bi ON bi.blood_group_id = bg.id
     GROUP BY bg.id, bg.group_name
     ORDER BY bg.id;

    -- 3. Donations in the last 30 days
    SELECT COUNT(*) AS donations_last_30_days,
           IFNULL(SUM(units_donated), 0) AS units_last_30_days
      FROM donation_records
     WHERE donation_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);

    -- 4. Requests by urgency
    SELECT urgency, COUNT(*) AS total, SUM(units_requested) AS total_units
      FROM blood_requests
     WHERE status IN ('pending', 'approved')
     GROUP BY urgency;
END$$

DELIMITER ;
