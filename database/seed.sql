-- ============================================================================
-- Blood Bank and Donor Slot Management System
-- Seed Data
-- MySQL 8.0+
-- ============================================================================

USE blood_bank_system;

-- ============================================================================
-- BLOOD GROUPS
-- ============================================================================
INSERT INTO blood_groups (group_name, description) VALUES
('A+',  'A Positive - Second most common blood type'),
('A-',  'A Negative - Universal platelet donor'),
('B+',  'B Positive - Third most common blood type'),
('B-',  'B Negative - Rare blood type'),
('AB+', 'AB Positive - Universal plasma recipient'),
('AB-', 'AB Negative - Rarest blood type'),
('O+',  'O Positive - Most common blood type'),
('O-',  'O Negative - Universal red cell donor');

-- ============================================================================
-- USERS
-- bcrypt hash of 'password123': $2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6
-- ============================================================================

-- Admin (id = 1)
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active) VALUES
('admin@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'admin', 'System', 'Administrator', '+1-555-0100', TRUE);

-- Staff (id = 2, 3)
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active) VALUES
('staff@bloodbank.com',  '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'staff', 'Sarah',  'Mitchell', '+1-555-0201', TRUE),
('staff2@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'staff', 'Robert', 'Chen',     '+1-555-0202', TRUE);

-- Requesters (id = 4, 5, 6)
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active) VALUES
('requester@bloodbank.com',  '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'requester', 'Dr. Maria',  'Santos',    '+1-555-0301', TRUE),
('requester2@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'requester', 'Dr. James',  'Wilson',    '+1-555-0302', TRUE),
('requester3@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'requester', 'Dr. Aisha',  'Patel',     '+1-555-0303', TRUE);

-- Donors (id = 7 through 36, 30 donors)
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active) VALUES
('donor1@bloodbank.com',  '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'John',      'Smith',       '+1-555-1001', TRUE),
('donor2@bloodbank.com',  '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Emily',     'Johnson',     '+1-555-1002', TRUE),
('donor3@bloodbank.com',  '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Michael',   'Williams',    '+1-555-1003', TRUE),
('donor4@bloodbank.com',  '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Jessica',   'Brown',       '+1-555-1004', TRUE),
('donor5@bloodbank.com',  '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'David',     'Jones',       '+1-555-1005', TRUE),
('donor6@bloodbank.com',  '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Ashley',    'Garcia',      '+1-555-1006', TRUE),
('donor7@bloodbank.com',  '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Chris',     'Martinez',    '+1-555-1007', TRUE),
('donor8@bloodbank.com',  '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Amanda',    'Anderson',    '+1-555-1008', TRUE),
('donor9@bloodbank.com',  '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Daniel',    'Taylor',      '+1-555-1009', TRUE),
('donor10@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Megan',     'Thomas',      '+1-555-1010', TRUE),
('donor11@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Andrew',    'Hernandez',   '+1-555-1011', TRUE),
('donor12@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Stephanie', 'Moore',       '+1-555-1012', TRUE),
('donor13@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Joshua',    'Martin',      '+1-555-1013', TRUE),
('donor14@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Nicole',    'Jackson',     '+1-555-1014', TRUE),
('donor15@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Ryan',      'Thompson',    '+1-555-1015', TRUE),
('donor16@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Lauren',    'White',       '+1-555-1016', TRUE),
('donor17@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Kevin',     'Lopez',       '+1-555-1017', TRUE),
('donor18@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Rachel',    'Lee',         '+1-555-1018', TRUE),
('donor19@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Brian',     'Gonzalez',    '+1-555-1019', TRUE),
('donor20@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Samantha',  'Harris',      '+1-555-1020', TRUE),
('donor21@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Justin',    'Clark',       '+1-555-1021', TRUE),
('donor22@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Kayla',     'Robinson',    '+1-555-1022', TRUE),
('donor23@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Brandon',   'Lewis',       '+1-555-1023', TRUE),
('donor24@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Brittany',  'Walker',      '+1-555-1024', TRUE),
('donor25@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Tyler',     'Young',       '+1-555-1025', TRUE),
('donor26@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Amber',     'Allen',       '+1-555-1026', TRUE),
('donor27@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Ethan',     'King',        '+1-555-1027', TRUE),
('donor28@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Victoria',  'Wright',      '+1-555-1028', TRUE),
('donor29@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Nathan',    'Scott',       '+1-555-1029', TRUE),
('donor30@bloodbank.com', '$2b$10$OGPpKNRMoaqcSnzfbLH3cOF1BIuTF62uJenV5iRuGrUoq/ZEol3X6', 'donor', 'Hannah',    'Torres',      '+1-555-1030', TRUE);

-- ============================================================================
-- DONORS (30 records, user_id 7–36)
-- blood_group_id: 1=A+, 2=A-, 3=B+, 4=B-, 5=AB+, 6=AB-, 7=O+, 8=O-
-- ============================================================================
INSERT INTO donors (user_id, blood_group_id, date_of_birth, gender, address, medical_notes, last_donation_date, total_donations, status) VALUES
( 7, 7, '1990-03-15', 'male',   '123 Oak Street, Springfield, IL 62701',       NULL,                              '2024-09-10', 5,  'active'),
( 8, 1, '1988-07-22', 'female', '456 Maple Ave, Columbus, OH 43215',           NULL,                              '2024-10-05', 3,  'active'),
( 9, 3, '1995-01-10', 'male',   '789 Pine Road, Denver, CO 80202',             'Mild allergy to latex gloves',    '2024-08-20', 7,  'active'),
(10, 8, '1992-11-05', 'female', '321 Elm Blvd, Austin, TX 78701',              NULL,                              '2024-07-15', 2,  'active'),
(11, 1, '1985-06-30', 'male',   '654 Cedar Lane, Portland, OR 97201',          NULL,                              '2024-06-01', 10, 'active'),
(12, 5, '1998-02-14', 'female', '987 Birch Court, Miami, FL 33101',            NULL,                              NULL,          0,  'registered'),
(13, 7, '1993-09-25', 'male',   '111 Walnut Dr, Seattle, WA 98101',            'Previous fainting episode',       '2024-05-10', 4,  'active'),
(14, 2, '1991-12-08', 'female', '222 Spruce Way, Boston, MA 02101',            NULL,                              '2024-10-20', 6,  'active'),
(15, 4, '1987-04-17', 'male',   '333 Willow St, Chicago, IL 60601',            NULL,                              '2024-04-30', 8,  'active'),
(16, 7, '1996-08-03', 'female', '444 Ash Ave, San Diego, CA 92101',            NULL,                              '2024-09-25', 1,  'active'),
(17, 3, '1989-10-12', 'male',   '555 Poplar Rd, Phoenix, AZ 85001',            'Iron supplements prescribed',     '2024-03-15', 9,  'deferred'),
(18, 1, '1994-05-20', 'female', '666 Hickory Ln, Nashville, TN 37201',         NULL,                              '2024-10-10', 2,  'active'),
(19, 6, '1986-01-28', 'male',   '777 Chestnut Blvd, Philadelphia, PA 19101',   NULL,                              '2024-08-05', 11, 'active'),
(20, 8, '1997-03-09', 'female', '888 Magnolia Dr, Atlanta, GA 30301',          NULL,                              NULL,          0,  'registered'),
(21, 7, '1990-07-14', 'male',   '999 Sycamore Ct, Minneapolis, MN 55401',      NULL,                              '2024-09-01', 3,  'active'),
(22, 2, '1993-11-22', 'female', '110 Beech Way, Detroit, MI 48201',            NULL,                              '2024-07-20', 5,  'active'),
(23, 5, '1988-09-05', 'male',   '220 Dogwood St, Charlotte, NC 28201',         'Tattoo in last 3 months',         NULL,          0,  'deferred'),
(24, 1, '1995-12-31', 'female', '330 Redwood Ave, San Francisco, CA 94101',    NULL,                              '2024-10-15', 4,  'active'),
(25, 7, '1991-04-07', 'male',   '440 Cypress Rd, Dallas, TX 75201',            NULL,                              '2024-06-10', 6,  'active'),
(26, 3, '1987-08-19', 'female', '550 Juniper Ln, Las Vegas, NV 89101',         NULL,                              '2024-05-25', 7,  'active'),
(27, 4, '1996-02-25', 'male',   '660 Hawthorn Blvd, Kansas City, MO 64101',    NULL,                              NULL,          0,  'registered'),
(28, 8, '1992-06-11', 'female', '770 Aspen Dr, Salt Lake City, UT 84101',      NULL,                              '2024-09-30', 2,  'active'),
(29, 1, '1989-10-03', 'male',   '880 Fir Ct, Raleigh, NC 27601',              NULL,                              '2024-08-15', 5,  'active'),
(30, 7, '1994-01-16', 'female', '990 Larch Way, Tampa, FL 33601',              NULL,                              '2024-04-20', 3,  'active'),
(31, 6, '1986-05-28', 'male',   '101 Sequoia St, Pittsburgh, PA 15201',        'Mild hypertension managed',       '2024-07-05', 8,  'active'),
(32, 2, '1998-09-14', 'female', '202 Cottonwood Ave, Indianapolis, IN 46201',  NULL,                              NULL,          0,  'registered'),
(33, 3, '1991-03-22', 'male',   '303 Alder Rd, Columbus, OH 43215',            NULL,                              '2024-10-01', 4,  'active'),
(34, 5, '1993-07-08', 'female', '404 Yew Ln, San Antonio, TX 78201',           NULL,                              '2024-06-20', 1,  'active'),
(35, 8, '1990-11-30', 'male',   '505 Hemlock Blvd, Jacksonville, FL 32201',    NULL,                              '2024-09-15', 6,  'active'),
(36, 7, '1997-04-12', 'female', '606 Laurel Dr, Milwaukee, WI 53201',          NULL,                              '2024-08-25', 2,  'active');

-- ============================================================================
-- DONATION SLOTS (12 slots, created_by staff user id=2)
-- Using future dates relative to a hypothetical "now" to keep data usable.
-- ============================================================================
INSERT INTO donation_slots (slot_date, start_time, end_time, location, capacity, available_capacity, status, created_by) VALUES
('2024-11-15', '08:00:00', '12:00:00', 'Main Blood Bank Center, 100 Health Ave, Springfield, IL',     20, 15, 'open',      2),
('2024-11-15', '13:00:00', '17:00:00', 'Main Blood Bank Center, 100 Health Ave, Springfield, IL',     20, 18, 'open',      2),
('2024-11-16', '09:00:00', '13:00:00', 'Community Hall, 250 Park Blvd, Columbus, OH',                 15, 10, 'open',      2),
('2024-11-17', '08:00:00', '12:00:00', 'University Medical Center, 500 Campus Dr, Denver, CO',        25, 20, 'open',      2),
('2024-11-18', '10:00:00', '14:00:00', 'City Hospital, 75 Medical Way, Austin, TX',                   10, 5,  'open',      2),
('2024-11-19', '08:00:00', '16:00:00', 'Red Cross Mobile Unit, Parking Lot B, Portland, OR',          30, 28, 'open',      2),
('2024-11-20', '09:00:00', '12:00:00', 'Corporate Office Drive, 900 Business Park, Miami, FL',        12, 12, 'open',      3),
('2024-11-21', '07:00:00', '11:00:00', 'Veterans Center, 300 Honor St, Seattle, WA',                  15, 13, 'open',      3),
('2024-11-22', '10:00:00', '15:00:00', 'Community Church Hall, 450 Faith Ave, Boston, MA',            20, 16, 'open',      3),
('2024-11-25', '08:00:00', '12:00:00', 'Sports Arena, 600 Victory Lane, Chicago, IL',                 25, 25, 'open',      3),
('2024-10-20', '09:00:00', '13:00:00', 'Downtown Library, 200 Book St, Nashville, TN',                15, 0,  'full',      2),
('2024-10-10', '08:00:00', '12:00:00', 'Fire Station 5, 150 Rescue Rd, Phoenix, AZ',                  10, 10, 'closed',    2);

-- ============================================================================
-- APPOINTMENTS (various statuses, realistic relationships)
-- donor_id matches donors table (1–30), slot_id matches slots (1–12)
-- ============================================================================

-- Disable the capacity-check trigger temporarily for seeding past/historical data
-- We handle this by inserting in an order consistent with available_capacity values above.

INSERT INTO appointments (donor_id, slot_id, booking_time, priority_level, status, scheduling_algorithm, state_changed_at, notes) VALUES
-- Slot 1 (cap 20, avail 15 → 5 booked)
(1,  1, '2024-11-10 09:00:00', 5, 'confirmed',  'FCFS',      '2024-11-10 09:05:00', 'Regular donor, confirmed via phone'),
(2,  1, '2024-11-10 09:15:00', 5, 'confirmed',  'FCFS',      '2024-11-10 09:20:00', NULL),
(3,  1, '2024-11-10 09:30:00', 3, 'waiting',    'Priority',  '2024-11-10 09:30:00', 'High-priority scheduled'),
(4,  1, '2024-11-10 10:00:00', 5, 'waiting',    'FCFS',      '2024-11-10 10:00:00', NULL),
(5,  1, '2024-11-10 10:15:00', 7, 'cancelled',  'FCFS',      '2024-11-12 08:00:00', 'Cancelled due to illness'),

-- Slot 2 (cap 20, avail 18 → 2 booked)
(6,  2, '2024-11-10 11:00:00', 5, 'waiting',    'FCFS',      '2024-11-10 11:00:00', NULL),
(7,  2, '2024-11-10 11:30:00', 4, 'waiting',    'Priority',  '2024-11-10 11:30:00', NULL),

-- Slot 3 (cap 15, avail 10 → 5 booked)
(8,  3, '2024-11-11 08:00:00', 5, 'confirmed',  'FCFS',      '2024-11-11 08:05:00', NULL),
(9,  3, '2024-11-11 08:30:00', 2, 'confirmed',  'Priority',  '2024-11-11 08:35:00', 'Urgent need - rare blood type'),
(10, 3, '2024-11-11 09:00:00', 5, 'waiting',    'FCFS',      '2024-11-11 09:00:00', NULL),
(11, 3, '2024-11-11 09:15:00', 5, 'rejected',   'FCFS',      '2024-11-13 10:00:00', 'Failed health screening'),
(12, 3, '2024-11-11 09:30:00', 5, 'waiting',    'RoundRobin','2024-11-11 09:30:00', NULL),

-- Slot 4 (cap 25, avail 20 → 5 booked)
(13, 4, '2024-11-12 07:00:00', 5, 'confirmed',  'FCFS',      '2024-11-12 07:05:00', NULL),
(14, 4, '2024-11-12 07:30:00', 1, 'confirmed',  'Priority',  '2024-11-12 07:35:00', 'Highest priority - rare type'),
(15, 4, '2024-11-12 08:00:00', 5, 'waiting',    'FCFS',      '2024-11-12 08:00:00', NULL),
(16, 4, '2024-11-12 08:30:00', 5, 'no_show',    'FCFS',      '2024-11-17 12:00:00', 'Did not attend'),
(17, 4, '2024-11-12 09:00:00', 5, 'cancelled',  'FCFS',      '2024-11-14 09:00:00', 'Rescheduled to later slot'),

-- Slot 5 (cap 10, avail 5 → 5 booked)
(18, 5, '2024-11-13 09:00:00', 5, 'confirmed',  'FCFS',      '2024-11-13 09:05:00', NULL),
(19, 5, '2024-11-13 09:30:00', 5, 'waiting',    'FCFS',      '2024-11-13 09:30:00', NULL),
(20, 5, '2024-11-13 10:00:00', 5, 'waiting',    'RoundRobin','2024-11-13 10:00:00', NULL),
(21, 5, '2024-11-13 10:30:00', 3, 'waiting',    'Priority',  '2024-11-13 10:30:00', NULL),
(22, 5, '2024-11-13 11:00:00', 5, 'waiting',    'FCFS',      '2024-11-13 11:00:00', NULL),

-- Slot 6 (cap 30, avail 28 → 2 booked)
(23, 6, '2024-11-14 08:00:00', 5, 'waiting',    'FCFS',      '2024-11-14 08:00:00', NULL),
(24, 6, '2024-11-14 08:30:00', 5, 'waiting',    'FCFS',      '2024-11-14 08:30:00', NULL),

-- Slot 8 (cap 15, avail 13 → 2 booked)
(25, 8, '2024-11-15 07:00:00', 5, 'confirmed',  'FCFS',      '2024-11-15 07:05:00', NULL),
(26, 8, '2024-11-15 07:30:00', 5, 'waiting',    'FCFS',      '2024-11-15 07:30:00', NULL),

-- Slot 9 (cap 20, avail 16 → 4 booked)
(27, 9, '2024-11-16 09:00:00', 5, 'waiting',    'FCFS',      '2024-11-16 09:00:00', NULL),
(28, 9, '2024-11-16 09:30:00', 5, 'waiting',    'FCFS',      '2024-11-16 09:30:00', NULL),
(29, 9, '2024-11-16 10:00:00', 5, 'waiting',    'RoundRobin','2024-11-16 10:00:00', NULL),
(30, 9, '2024-11-16 10:30:00', 5, 'waiting',    'FCFS',      '2024-11-16 10:30:00', NULL),

-- Slot 11 (historical – full, past appointments donated)
(1, 11, '2024-10-15 08:00:00', 5, 'donated',    'FCFS',      '2024-10-20 09:30:00', 'Completed successfully'),
(2, 11, '2024-10-15 08:15:00', 5, 'donated',    'FCFS',      '2024-10-20 10:00:00', 'Completed successfully'),
(3, 11, '2024-10-15 08:30:00', 5, 'donated',    'FCFS',      '2024-10-20 10:30:00', 'Completed successfully');

-- ============================================================================
-- DONATION RECORDS (for the 3 donated appointments above – ids 31, 32, 33)
-- ============================================================================
INSERT INTO donation_records (appointment_id, donor_id, blood_group_id, units_donated, donation_date, hemoglobin_level, blood_pressure, temperature, staff_id, notes) VALUES
(31, 1, 7, 1.0, '2024-10-20', 14.5, '120/80', 98.6, 2, 'Smooth donation, no complications'),
(32, 2, 1, 1.0, '2024-10-20', 13.2, '118/76', 98.4, 2, 'Completed without issues'),
(33, 3, 3, 1.0, '2024-10-20', 15.1, '122/82', 98.7, 3, 'Used non-latex gloves per donor request');

-- ============================================================================
-- BLOOD INVENTORY (all 8 groups, multiple batches)
-- ============================================================================
INSERT INTO blood_inventory (blood_group_id, units_available, units_reserved, expiry_date, batch_number, status) VALUES
-- A+
(1, 12, 2, '2024-12-15', 'BATCH-20241020-00001', 'available'),
(1,  5, 0, '2024-12-20', 'BATCH-20241025-00002', 'available'),
-- A-
(2,  4, 1, '2024-12-10', 'BATCH-20241018-00003', 'available'),
(2,  3, 0, '2024-12-22', 'BATCH-20241028-00004', 'available'),
-- B+
(3,  8, 0, '2024-12-18', 'BATCH-20241020-00005', 'available'),
(3,  6, 2, '2024-12-25', 'BATCH-20241101-00006', 'available'),
-- B-
(4,  3, 0, '2024-12-12', 'BATCH-20241015-00007', 'available'),
(4,  2, 1, '2024-12-28', 'BATCH-20241105-00008', 'available'),
-- AB+
(5,  5, 0, '2024-12-14', 'BATCH-20241019-00009', 'available'),
(5,  4, 0, '2024-12-30', 'BATCH-20241108-00010', 'available'),
-- AB-
(6,  2, 0, '2024-12-11', 'BATCH-20241016-00011', 'available'),
(6,  1, 0, '2024-12-26', 'BATCH-20241103-00012', 'available'),
-- O+
(7, 15, 3, '2024-12-20', 'BATCH-20241020-00013', 'available'),
(7, 10, 0, '2024-12-31', 'BATCH-20241110-00014', 'available'),
-- O-
(8,  6, 1, '2024-12-16', 'BATCH-20241022-00015', 'available'),
(8,  4, 0, '2024-12-29', 'BATCH-20241107-00016', 'available'),
-- Expired / used historical batches
(7,  0, 0, '2024-10-01', 'BATCH-20240820-00017', 'expired'),
(1,  0, 0, '2024-09-15', 'BATCH-20240805-00018', 'used');

-- ============================================================================
-- BLOOD REQUESTS (various statuses and urgencies)
-- ============================================================================
INSERT INTO blood_requests (requester_id, blood_group_id, units_requested, urgency, patient_name, hospital_name, reason, status, request_date, fulfilled_date, notes) VALUES
(4, 7, 3, 'urgent',   'Carlos Rivera',    'Springfield General Hospital',    'Emergency surgery - internal bleeding',          'fulfilled',            '2024-10-18', '2024-10-18', 'Fulfilled from existing O+ inventory'),
(4, 8, 2, 'critical', 'Jane Doe',         'Springfield General Hospital',    'Massive trauma, universal donor needed',         'fulfilled',            '2024-10-19', '2024-10-19', 'Critical request fulfilled immediately'),
(5, 1, 4, 'normal',   'Robert Kim',       'Columbus Medical Center',         'Scheduled cardiac surgery',                      'approved',             '2024-11-10', NULL,         'Surgery scheduled for Nov 20'),
(5, 3, 2, 'urgent',   'Lisa Chen',        'Columbus Medical Center',         'Post-operative transfusion',                     'pending',              '2024-11-12', NULL,         NULL),
(6, 5, 1, 'normal',   'Ahmad Hassan',     'Denver University Hospital',      'Chemotherapy support',                           'pending',              '2024-11-13', NULL,         'Weekly transfusion schedule'),
(6, 8, 5, 'critical', 'Maria Gonzalez',   'Denver University Hospital',      'Severe anemia, multiple units needed',           'partially_fulfilled',  '2024-11-11', NULL,         'Only 3 units available so far'),
(4, 2, 2, 'normal',   'Thomas Wright',    'Springfield General Hospital',    'Planned hip replacement',                        'pending',              '2024-11-14', NULL,         'Surgery in 2 weeks'),
(5, 7, 6, 'urgent',   'Sarah Johnson',    'Columbus Medical Center',         'Gastrointestinal bleeding',                      'approved',             '2024-11-13', NULL,         'Approved, awaiting fulfillment');

-- ============================================================================
-- REQUEST FULFILMENTS (for fulfilled / partially fulfilled requests)
-- ============================================================================
INSERT INTO request_fulfilments (request_id, inventory_id, units_fulfilled, fulfilled_by, fulfilled_at, notes) VALUES
(1, 13, 3, 2, '2024-10-18 14:30:00', 'O+ units dispatched to Springfield General'),
(2, 15, 2, 2, '2024-10-19 06:15:00', 'Emergency O- dispatch, courier delivered'),
(6, 15, 2, 3, '2024-11-11 10:00:00', 'Partial fulfillment from O- stock'),
(6, 16, 1, 3, '2024-11-11 10:15:00', 'Additional unit from second O- batch');

-- ============================================================================
-- SCHEDULER CONFIG
-- ============================================================================
INSERT INTO scheduler_config (algorithm, time_quantum, is_active, updated_by) VALUES
('FCFS',        3, TRUE,  1),
('Priority',    3, FALSE, 1),
('RoundRobin',  5, FALSE, 1);

-- ============================================================================
-- AUDIT LOGS (sample entries)
-- ============================================================================
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at) VALUES
(1,    'USER_CREATED',               'user',            1,    NULL, JSON_OBJECT('email','admin@bloodbank.com','role','admin'),                                          '192.168.1.1',   '2024-10-01 08:00:00'),
(1,    'USER_CREATED',               'user',            2,    NULL, JSON_OBJECT('email','staff@bloodbank.com','role','staff'),                                          '192.168.1.1',   '2024-10-01 08:05:00'),
(1,    'SCHEDULER_CONFIG_UPDATED',   'scheduler_config',1,    NULL, JSON_OBJECT('algorithm','FCFS','time_quantum',3,'is_active',TRUE),                                  '192.168.1.1',   '2024-10-01 08:10:00'),
(2,    'SLOT_CREATED',               'donation_slot',   1,    NULL, JSON_OBJECT('slot_date','2024-11-15','location','Main Blood Bank Center','capacity',20),             '192.168.1.10',  '2024-11-08 09:00:00'),
(2,    'SLOT_CREATED',               'donation_slot',   2,    NULL, JSON_OBJECT('slot_date','2024-11-15','location','Main Blood Bank Center','capacity',20),             '192.168.1.10',  '2024-11-08 09:05:00'),
(NULL, 'APPOINTMENT_CREATED',        'appointment',     1,    NULL, JSON_OBJECT('donor_id',1,'slot_id',1,'status','waiting','scheduling_algorithm','FCFS'),              '10.0.0.50',     '2024-11-10 09:00:00'),
(NULL, 'APPOINTMENT_STATUS_CHANGED', 'appointment',     1,    JSON_OBJECT('status','waiting'), JSON_OBJECT('status','confirmed'),                                       '192.168.1.10',  '2024-11-10 09:05:00'),
(NULL, 'APPOINTMENT_STATUS_CHANGED', 'appointment',     5,    JSON_OBJECT('status','waiting'), JSON_OBJECT('status','cancelled'),                                       '10.0.0.54',     '2024-11-12 08:00:00'),
(2,    'DONATION_COMPLETED',         'donation_record', 1,    NULL, JSON_OBJECT('appointment_id',31,'donor_id',1,'units_donated',1.0),                                  '192.168.1.10',  '2024-10-20 09:30:00'),
(2,    'DONATION_COMPLETED',         'donation_record', 2,    NULL, JSON_OBJECT('appointment_id',32,'donor_id',2,'units_donated',1.0),                                  '192.168.1.10',  '2024-10-20 10:00:00'),
(3,    'DONATION_COMPLETED',         'donation_record', 3,    NULL, JSON_OBJECT('appointment_id',33,'donor_id',3,'units_donated',1.0),                                  '192.168.1.10',  '2024-10-20 10:30:00'),
(NULL, 'INVENTORY_UPDATED',          'blood_inventory', 13,   JSON_OBJECT('units_available',18,'status','available'), JSON_OBJECT('units_available',15,'status','available'), '192.168.1.10','2024-10-18 14:30:00'),
(2,    'REQUEST_FULFILLED',          'blood_request',   1,    JSON_OBJECT('status','pending'), JSON_OBJECT('status','fulfilled','units_fulfilled',3),                    '192.168.1.10',  '2024-10-18 14:35:00'),
(2,    'REQUEST_FULFILLED',          'blood_request',   2,    JSON_OBJECT('status','pending'), JSON_OBJECT('status','fulfilled','units_fulfilled',2),                    '192.168.1.10',  '2024-10-19 06:20:00'),
(NULL, 'APPOINTMENT_STATUS_CHANGED', 'appointment',     16,   JSON_OBJECT('status','waiting'), JSON_OBJECT('status','no_show'),                                         '192.168.1.10',  '2024-11-17 12:00:00');
