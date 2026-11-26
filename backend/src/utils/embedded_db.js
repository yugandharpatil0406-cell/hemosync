// Embedded in-memory / JSON database for HemoSync Blood Bank System
// Provides complete fallback when MySQL / XAMPP is offline.
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '..', 'database_state.json');

const INITIAL_BLOOD_GROUPS = [
  { id: 1, group_name: 'A+', description: 'A Positive - Second most common blood type' },
  { id: 2, group_name: 'A-', description: 'A Negative - Universal platelet donor' },
  { id: 3, group_name: 'B+', description: 'B Positive - Third most common blood type' },
  { id: 4, group_name: 'B-', description: 'B Negative - Rare blood type' },
  { id: 5, group_name: 'AB+', description: 'AB Positive - Universal plasma recipient' },
  { id: 6, group_name: 'AB-', description: 'AB Negative - Rarest blood type' },
  { id: 7, group_name: 'O+', description: 'O Positive - Most common blood type' },
  { id: 8, group_name: 'O-', description: 'O Negative - Universal red cell donor' }
];

// Hash for 'password123'
const DEFAULT_HASH = '$2b$10$RN6pLyHJTCZrw.c1WmZu6ue4ApXCDTl6BXR0lVISmxpkv10g3JgjO';

const INITIAL_USERS = [
  { id: 1, email: 'admin@bloodbank.com', password_hash: DEFAULT_HASH, role: 'admin', first_name: 'System', last_name: 'Administrator', phone: '+1-555-0100', is_active: 1 },
  { id: 2, email: 'staff@bloodbank.com', password_hash: DEFAULT_HASH, role: 'staff', first_name: 'Sarah', last_name: 'Mitchell', phone: '+1-555-0201', is_active: 1 },
  { id: 3, email: 'staff2@bloodbank.com', password_hash: DEFAULT_HASH, role: 'staff', first_name: 'Robert', last_name: 'Chen', phone: '+1-555-0202', is_active: 1 },
  { id: 4, email: 'requester@bloodbank.com', password_hash: DEFAULT_HASH, role: 'requester', first_name: 'Dr. Maria', last_name: 'Santos', phone: '+1-555-0301', is_active: 1 },
  { id: 5, email: 'requester2@bloodbank.com', password_hash: DEFAULT_HASH, role: 'requester', first_name: 'Dr. James', last_name: 'Wilson', phone: '+1-555-0302', is_active: 1 },
  { id: 6, email: 'requester3@bloodbank.com', password_hash: DEFAULT_HASH, role: 'requester', first_name: 'Dr. Aisha', last_name: 'Patel', phone: '+1-555-0303', is_active: 1 }
];

const DONOR_NAMES = [
  ['John', 'Smith'], ['Emily', 'Johnson'], ['Michael', 'Williams'], ['Jessica', 'Brown'],
  ['David', 'Jones'], ['Ashley', 'Garcia'], ['Chris', 'Martinez'], ['Amanda', 'Anderson'],
  ['Daniel', 'Taylor'], ['Megan', 'Thomas'], ['Andrew', 'Hernandez'], ['Stephanie', 'Moore'],
  ['Joshua', 'Martin'], ['Nicole', 'Jackson'], ['Ryan', 'Thompson'], ['Lauren', 'White'],
  ['Kevin', 'Lopez'], ['Rachel', 'Lee'], ['Brian', 'Gonzalez'], ['Samantha', 'Harris'],
  ['Justin', 'Clark'], ['Kayla', 'Robinson'], ['Brandon', 'Lewis'], ['Brittany', 'Walker'],
  ['Tyler', 'Young'], ['Amber', 'Allen'], ['Ethan', 'King'], ['Victoria', 'Wright'],
  ['Nathan', 'Scott'], ['Hannah', 'Torres']
];

for (let i = 0; i < 30; i++) {
  const [first, last] = DONOR_NAMES[i];
  INITIAL_USERS.push({
    id: 7 + i,
    email: `donor${i + 1}@bloodbank.com`,
    password_hash: DEFAULT_HASH,
    role: 'donor',
    first_name: first,
    last_name: last,
    phone: `+1-555-10${(i + 1).toString().padStart(2, '0')}`,
    is_active: 1
  });
}

const DONOR_METADATA = [
  { bg: 7, dob: '1990-03-15', g: 'male',   addr: '123 Oak Street, Springfield, IL 62701', notes: null, ldd: '2024-09-10', tot: 5, stat: 'active' },
  { bg: 1, dob: '1988-07-22', g: 'female', addr: '456 Maple Ave, Columbus, OH 43215', notes: null, ldd: '2024-10-05', tot: 3, stat: 'active' },
  { bg: 3, dob: '1995-01-10', g: 'male',   addr: '789 Pine Road, Denver, CO 80202', notes: 'Mild allergy to latex gloves', ldd: '2024-08-20', tot: 7, stat: 'active' },
  { bg: 8, dob: '1992-11-05', g: 'female', addr: '321 Elm Blvd, Austin, TX 78701', notes: null, ldd: '2024-07-15', tot: 2, stat: 'active' },
  { bg: 1, dob: '1985-06-30', g: 'male',   addr: '654 Cedar Lane, Portland, OR 97201', notes: null, ldd: '2024-06-01', tot: 10, stat: 'active' },
  { bg: 5, dob: '1998-02-14', g: 'female', addr: '987 Birch Court, Miami, FL 33101', notes: null, ldd: null, tot: 0, stat: 'registered' },
  { bg: 7, dob: '1993-09-25', g: 'male',   addr: '111 Walnut Dr, Seattle, WA 98101', notes: 'Previous fainting episode', ldd: '2024-05-10', tot: 4, stat: 'active' },
  { bg: 2, dob: '1991-12-08', g: 'female', addr: '222 Spruce Way, Boston, MA 02101', notes: null, ldd: '2024-10-20', tot: 6, stat: 'active' },
  { bg: 4, dob: '1987-04-17', g: 'male',   addr: '333 Willow St, Chicago, IL 60601', notes: null, ldd: '2024-04-30', tot: 8, stat: 'active' },
  { bg: 7, dob: '1996-08-03', g: 'female', addr: '444 Ash Ave, San Diego, CA 92101', notes: null, ldd: '2024-09-25', tot: 1, stat: 'active' },
  { bg: 3, dob: '1989-10-12', g: 'male',   addr: '555 Poplar Rd, Phoenix, AZ 85001', notes: 'Iron supplements prescribed', ldd: '2024-03-15', tot: 9, stat: 'deferred' },
  { bg: 1, dob: '1994-05-20', g: 'female', addr: '666 Hickory Ln, Nashville, TN 37201', notes: null, ldd: '2024-10-10', tot: 2, stat: 'active' },
  { bg: 6, dob: '1986-01-28', g: 'male',   addr: '777 Chestnut Blvd, Philadelphia, PA 19101', notes: null, ldd: '2024-08-05', tot: 11, stat: 'active' },
  { bg: 8, dob: '1997-03-09', g: 'female', addr: '888 Magnolia Dr, Atlanta, GA 30301', notes: null, ldd: null, tot: 0, stat: 'registered' },
  { bg: 7, dob: '1990-07-14', g: 'male',   addr: '999 Sycamore Ct, Minneapolis, MN 55401', notes: null, ldd: '2024-09-01', tot: 3, stat: 'active' },
  { bg: 2, dob: '1993-11-22', g: 'female', addr: '110 Beech Way, Detroit, MI 48201', notes: null, ldd: '2024-07-20', tot: 5, stat: 'active' },
  { bg: 5, dob: '1988-09-05', g: 'male',   addr: '220 Dogwood St, Charlotte, NC 28201', notes: 'Tattoo in last 3 months', ldd: null, tot: 0, stat: 'deferred' },
  { bg: 1, dob: '1995-12-31', g: 'female', addr: '330 Redwood Ave, San Francisco, CA 94101', notes: null, ldd: '2024-10-15', tot: 4, stat: 'active' },
  { bg: 7, dob: '1991-04-07', g: 'male',   addr: '440 Cypress Rd, Dallas, TX 75201', notes: null, ldd: '2024-06-10', tot: 6, stat: 'active' },
  { bg: 3, dob: '1987-08-19', g: 'female', addr: '550 Juniper Ln, Las Vegas, NV 89101', notes: null, ldd: '2024-05-25', tot: 7, stat: 'active' },
  { bg: 4, dob: '1996-02-25', g: 'male',   addr: '660 Hawthorn Blvd, Kansas City, MO 64101', notes: null, ldd: null, tot: 0, stat: 'registered' },
  { bg: 8, dob: '1992-06-11', g: 'female', addr: '770 Aspen Dr, Salt Lake City, UT 84101', notes: null, ldd: '2024-09-30', tot: 2, stat: 'active' },
  { bg: 1, dob: '1989-10-03', g: 'male',   addr: '880 Fir Ct, Raleigh, NC 27601', notes: null, ldd: '2024-08-15', tot: 5, stat: 'active' },
  { bg: 7, dob: '1994-01-16', g: 'female', addr: '990 Larch Way, Tampa, FL 33601', notes: null, ldd: '2024-04-20', tot: 3, stat: 'active' },
  { bg: 6, dob: '1986-05-28', g: 'male',   addr: '101 Sequoia St, Pittsburgh, PA 15201', notes: 'Mild hypertension managed', ldd: '2024-07-05', tot: 8, stat: 'active' },
  { bg: 2, dob: '1998-09-14', g: 'female', addr: '202 Cottonwood Ave, Indianapolis, IN 46201', notes: null, ldd: null, tot: 0, stat: 'registered' },
  { bg: 3, dob: '1991-03-22', g: 'male',   addr: '303 Alder Rd, Columbus, OH 43215', notes: null, ldd: '2024-10-01', tot: 4, stat: 'active' },
  { bg: 5, dob: '1993-07-08', g: 'female', addr: '404 Yew Ln, San Antonio, TX 78201', notes: null, ldd: '2024-06-20', tot: 1, stat: 'active' },
  { bg: 8, dob: '1990-11-30', g: 'male',   addr: '505 Hemlock Blvd, Jacksonville, FL 32201', notes: null, ldd: '2024-09-15', tot: 6, stat: 'active' },
  { bg: 7, dob: '1997-04-12', g: 'female', addr: '606 Laurel Dr, Milwaukee, WI 53201', notes: null, ldd: '2024-08-25', tot: 2, stat: 'active' }
];

const INITIAL_DONORS = DONOR_METADATA.map((m, idx) => ({
  id: idx + 1,
  user_id: 7 + idx,
  blood_group_id: m.bg,
  date_of_birth: m.dob,
  gender: m.g,
  address: m.addr,
  medical_notes: m.notes,
  last_donation_date: m.ldd,
  total_donations: m.tot,
  status: m.stat,
  created_at: '2024-10-01 10:00:00'
}));

const INITIAL_SLOTS = [
  { id: 1, slot_date: '2024-11-15', start_time: '08:00:00', end_time: '12:00:00', location: 'Main Blood Bank Center, 100 Health Ave, Springfield, IL', capacity: 20, available_capacity: 15, status: 'open', created_by: 2 },
  { id: 2, slot_date: '2024-11-15', start_time: '13:00:00', end_time: '17:00:00', location: 'Main Blood Bank Center, 100 Health Ave, Springfield, IL', capacity: 20, available_capacity: 18, status: 'open', created_by: 2 },
  { id: 3, slot_date: '2024-11-16', start_time: '09:00:00', end_time: '13:00:00', location: 'Community Hall, 250 Park Blvd, Columbus, OH', capacity: 15, available_capacity: 10, status: 'open', created_by: 2 },
  { id: 4, slot_date: '2024-11-17', start_time: '08:00:00', end_time: '12:00:00', location: 'University Medical Center, 500 Campus Dr, Denver, CO', capacity: 25, available_capacity: 20, status: 'open', created_by: 2 },
  { id: 5, slot_date: '2024-11-18', start_time: '10:00:00', end_time: '14:00:00', location: 'City Hospital, 75 Medical Way, Austin, TX', capacity: 10, available_capacity: 5, status: 'open', created_by: 2 },
  { id: 6, slot_date: '2024-11-19', start_time: '08:00:00', end_time: '16:00:00', location: 'Red Cross Mobile Unit, Parking Lot B, Portland, OR', capacity: 30, available_capacity: 28, status: 'open', created_by: 2 },
  { id: 7, slot_date: '2024-11-20', start_time: '09:00:00', end_time: '12:00:00', location: 'Corporate Office Drive, 900 Business Park, Miami, FL', capacity: 12, available_capacity: 12, status: 'open', created_by: 3 },
  { id: 8, slot_date: '2024-11-21', start_time: '07:00:00', end_time: '11:00:00', location: 'Veterans Center, 300 Honor St, Seattle, WA', capacity: 15, available_capacity: 13, status: 'open', created_by: 3 },
  { id: 9, slot_date: '2024-11-22', start_time: '10:00:00', end_time: '15:00:00', location: 'Community Church Hall, 450 Faith Ave, Boston, MA', capacity: 20, available_capacity: 16, status: 'open', created_by: 3 },
  { id: 10, slot_date: '2024-11-25', start_time: '08:00:00', end_time: '12:00:00', location: 'Sports Arena, 600 Victory Lane, Chicago, IL', capacity: 25, available_capacity: 25, status: 'open', created_by: 3 },
  { id: 11, slot_date: '2024-10-20', start_time: '09:00:00', end_time: '13:00:00', location: 'Downtown Library, 200 Book St, Nashville, TN', capacity: 15, available_capacity: 0, status: 'full', created_by: 2 },
  { id: 12, slot_date: '2024-10-10', start_time: '08:00:00', end_time: '12:00:00', location: 'Fire Station 5, 150 Rescue Rd, Phoenix, AZ', capacity: 10, available_capacity: 10, status: 'closed', created_by: 2 }
];

const INITIAL_APPOINTMENTS = [
  { id: 1, donor_id: 1, slot_id: 1, booking_time: '2024-11-10 09:00:00', priority_level: 5, status: 'confirmed', scheduling_algorithm: 'FCFS', state_changed_at: '2024-11-10 09:05:00', notes: 'Regular donor, confirmed via phone' },
  { id: 2, donor_id: 2, slot_id: 1, booking_time: '2024-11-10 09:15:00', priority_level: 5, status: 'confirmed', scheduling_algorithm: 'FCFS', state_changed_at: '2024-11-10 09:20:00', notes: null },
  { id: 3, donor_id: 3, slot_id: 1, booking_time: '2024-11-10 09:30:00', priority_level: 3, status: 'waiting', scheduling_algorithm: 'Priority', state_changed_at: '2024-11-10 09:30:00', notes: 'High-priority scheduled' },
  { id: 4, donor_id: 4, slot_id: 1, booking_time: '2024-11-10 10:00:00', priority_level: 5, status: 'waiting', scheduling_algorithm: 'FCFS', state_changed_at: '2024-11-10 10:00:00', notes: null },
  { id: 5, donor_id: 5, slot_id: 1, booking_time: '2024-11-10 10:15:00', priority_level: 7, status: 'cancelled', scheduling_algorithm: 'FCFS', state_changed_at: '2024-11-12 08:00:00', notes: 'Cancelled due to illness' },
  { id: 6, donor_id: 6, slot_id: 2, booking_time: '2024-11-10 11:00:00', priority_level: 5, status: 'waiting', scheduling_algorithm: 'FCFS', state_changed_at: '2024-11-10 11:00:00', notes: null },
  { id: 7, donor_id: 7, slot_id: 2, booking_time: '2024-11-10 11:30:00', priority_level: 4, status: 'waiting', scheduling_algorithm: 'Priority', state_changed_at: '2024-11-10 11:30:00', notes: null },
  { id: 8, donor_id: 8, slot_id: 3, booking_time: '2024-11-11 08:00:00', priority_level: 5, status: 'confirmed', scheduling_algorithm: 'FCFS', state_changed_at: '2024-11-11 08:05:00', notes: null },
  { id: 9, donor_id: 9, slot_id: 3, booking_time: '2024-11-11 08:30:00', priority_level: 2, status: 'confirmed', scheduling_algorithm: 'Priority', state_changed_at: '2024-11-11 08:35:00', notes: 'Urgent need - rare blood type' },
  { id: 10, donor_id: 10, slot_id: 3, booking_time: '2024-11-11 09:00:00', priority_level: 5, status: 'waiting', scheduling_algorithm: 'FCFS', state_changed_at: '2024-11-11 09:00:00', notes: null },
  { id: 31, donor_id: 1, slot_id: 11, booking_time: '2024-10-15 08:00:00', priority_level: 5, status: 'donated', scheduling_algorithm: 'FCFS', state_changed_at: '2024-10-20 09:30:00', notes: 'Completed successfully' },
  { id: 32, donor_id: 2, slot_id: 11, booking_time: '2024-10-15 08:15:00', priority_level: 5, status: 'donated', scheduling_algorithm: 'FCFS', state_changed_at: '2024-10-20 10:00:00', notes: 'Completed successfully' },
  { id: 33, donor_id: 3, slot_id: 11, booking_time: '2024-10-15 08:30:00', priority_level: 5, status: 'donated', scheduling_algorithm: 'FCFS', state_changed_at: '2024-10-20 10:30:00', notes: 'Completed successfully' }
];

const INITIAL_DONATION_RECORDS = [
  { id: 1, appointment_id: 31, donor_id: 1, blood_group_id: 7, units_donated: 1.0, donation_date: '2024-10-20', hemoglobin_level: 14.5, blood_pressure: '120/80', temperature: 98.6, staff_id: 2, notes: 'Smooth donation, no complications', created_at: '2024-10-20 09:30:00' },
  { id: 2, appointment_id: 32, donor_id: 2, blood_group_id: 1, units_donated: 1.0, donation_date: '2024-10-20', hemoglobin_level: 13.2, blood_pressure: '118/76', temperature: 98.4, staff_id: 2, notes: 'Completed without issues', created_at: '2024-10-20 10:00:00' },
  { id: 3, appointment_id: 33, donor_id: 3, blood_group_id: 3, units_donated: 1.0, donation_date: '2024-10-20', hemoglobin_level: 15.1, blood_pressure: '122/82', temperature: 98.7, staff_id: 3, notes: 'Used non-latex gloves per donor request', created_at: '2024-10-20 10:30:00' }
];

const INITIAL_INVENTORY = [
  { id: 1, blood_group_id: 1, units_available: 12, units_reserved: 2, expiry_date: '2028-12-15', batch_number: 'BATCH-20241020-00001', status: 'available', created_at: '2024-10-20 09:30:00' },
  { id: 2, blood_group_id: 1, units_available: 5, units_reserved: 0, expiry_date: '2028-12-20', batch_number: 'BATCH-20241025-00002', status: 'available', created_at: '2024-10-25 09:30:00' },
  { id: 3, blood_group_id: 2, units_available: 4, units_reserved: 1, expiry_date: '2028-12-10', batch_number: 'BATCH-20241018-00003', status: 'available', created_at: '2024-10-18 09:30:00' },
  { id: 4, blood_group_id: 2, units_available: 3, units_reserved: 0, expiry_date: '2028-12-22', batch_number: 'BATCH-20241028-00004', status: 'available', created_at: '2024-10-28 09:30:00' },
  { id: 5, blood_group_id: 3, units_available: 8, units_reserved: 0, expiry_date: '2028-12-18', batch_number: 'BATCH-20241020-00005', status: 'available', created_at: '2024-10-20 09:30:00' },
  { id: 6, blood_group_id: 3, units_available: 6, units_reserved: 2, expiry_date: '2028-12-25', batch_number: 'BATCH-20241101-00006', status: 'available', created_at: '2024-11-01 09:30:00' },
  { id: 7, blood_group_id: 4, units_available: 3, units_reserved: 0, expiry_date: '2028-12-12', batch_number: 'BATCH-20241015-00007', status: 'available', created_at: '2024-10-15 09:30:00' },
  { id: 8, blood_group_id: 4, units_available: 2, units_reserved: 1, expiry_date: '2028-12-28', batch_number: 'BATCH-20241105-00008', status: 'available', created_at: '2024-11-05 09:30:00' },
  { id: 9, blood_group_id: 5, units_available: 5, units_reserved: 0, expiry_date: '2028-12-14', batch_number: 'BATCH-20241019-00009', status: 'available', created_at: '2024-10-19 09:30:00' },
  { id: 10, blood_group_id: 5, units_available: 4, units_reserved: 0, expiry_date: '2028-12-30', batch_number: 'BATCH-20241108-00010', status: 'available', created_at: '2024-11-08 09:30:00' },
  { id: 11, blood_group_id: 6, units_available: 2, units_reserved: 0, expiry_date: '2028-12-11', batch_number: 'BATCH-20241016-00011', status: 'available', created_at: '2024-10-16 09:30:00' },
  { id: 12, blood_group_id: 6, units_available: 1, units_reserved: 0, expiry_date: '2028-12-26', batch_number: 'BATCH-20241103-00012', status: 'available', created_at: '2024-11-03 09:30:00' },
  { id: 13, blood_group_id: 7, units_available: 15, units_reserved: 3, expiry_date: '2028-12-20', batch_number: 'BATCH-20241020-00013', status: 'available', created_at: '2024-10-20 09:30:00' },
  { id: 14, blood_group_id: 7, units_available: 10, units_reserved: 0, expiry_date: '2028-12-31', batch_number: 'BATCH-20241110-00014', status: 'available', created_at: '2024-11-10 09:30:00' },
  { id: 15, blood_group_id: 8, units_available: 6, units_reserved: 1, expiry_date: '2028-12-16', batch_number: 'BATCH-20241022-00015', status: 'available', created_at: '2024-10-22 09:30:00' },
  { id: 16, blood_group_id: 8, units_available: 4, units_reserved: 0, expiry_date: '2028-12-29', batch_number: 'BATCH-20241107-00016', status: 'available', created_at: '2024-11-07 09:30:00' }
];

const INITIAL_REQUESTS = [
  { id: 1, requester_id: 4, blood_group_id: 7, units_requested: 3, urgency: 'urgent', patient_name: 'Carlos Rivera', hospital_name: 'Springfield General Hospital', reason: 'Emergency surgery - internal bleeding', status: 'fulfilled', request_date: '2024-10-18', fulfilled_date: '2024-10-18', notes: 'Fulfilled from existing O+ inventory', created_at: '2024-10-18 10:00:00' },
  { id: 2, requester_id: 4, blood_group_id: 8, units_requested: 2, urgency: 'critical', patient_name: 'Jane Doe', hospital_name: 'Springfield General Hospital', reason: 'Massive trauma, universal donor needed', status: 'fulfilled', request_date: '2024-10-19', fulfilled_date: '2024-10-19', notes: 'Critical request fulfilled immediately', created_at: '2024-10-19 06:00:00' },
  { id: 3, requester_id: 5, blood_group_id: 1, units_requested: 4, urgency: 'normal', patient_name: 'Robert Kim', hospital_name: 'Columbus Medical Center', reason: 'Scheduled cardiac surgery', status: 'approved', request_date: '2024-11-10', fulfilled_date: null, notes: 'Surgery scheduled for Nov 20', created_at: '2024-11-10 10:00:00' },
  { id: 4, requester_id: 5, blood_group_id: 3, units_requested: 2, urgency: 'urgent', patient_name: 'Lisa Chen', hospital_name: 'Columbus Medical Center', reason: 'Post-operative transfusion', status: 'pending', request_date: '2024-11-12', fulfilled_date: null, notes: null, created_at: '2024-11-12 10:00:00' },
  { id: 5, requester_id: 6, blood_group_id: 5, units_requested: 1, urgency: 'normal', patient_name: 'Ahmad Hassan', hospital_name: 'Denver University Hospital', reason: 'Chemotherapy support', status: 'pending', request_date: '2024-11-13', fulfilled_date: null, notes: 'Weekly transfusion schedule', created_at: '2024-11-13 10:00:00' },
  { id: 6, requester_id: 6, blood_group_id: 8, units_requested: 5, urgency: 'critical', patient_name: 'Maria Gonzalez', hospital_name: 'Denver University Hospital', reason: 'Severe anemia, multiple units needed', status: 'partially_fulfilled', request_date: '2024-11-11', fulfilled_date: null, notes: 'Only 3 units available so far', created_at: '2024-11-11 10:00:00' },
  { id: 7, requester_id: 4, blood_group_id: 2, units_requested: 2, urgency: 'normal', patient_name: 'Thomas Wright', hospital_name: 'Springfield General Hospital', reason: 'Planned hip replacement', status: 'pending', request_date: '2024-11-14', fulfilled_date: null, notes: 'Surgery in 2 weeks', created_at: '2024-11-14 10:00:00' },
  { id: 8, requester_id: 5, blood_group_id: 7, units_requested: 6, urgency: 'urgent', patient_name: 'Sarah Johnson', hospital_name: 'Columbus Medical Center', reason: 'Gastrointestinal bleeding', status: 'approved', request_date: '2024-11-13', fulfilled_date: null, notes: 'Approved, awaiting fulfillment', created_at: '2024-11-13 10:00:00' }
];

const INITIAL_SCHEDULER_CONFIG = [
  { id: 1, algorithm: 'FCFS', time_quantum: 3, is_active: 1, updated_by: 1 },
  { id: 2, algorithm: 'Priority', time_quantum: 3, is_active: 0, updated_by: 1 },
  { id: 3, algorithm: 'RoundRobin', time_quantum: 5, is_active: 0, updated_by: 1 }
];

const INITIAL_AUDIT_LOGS = [
  { id: 1, user_id: 1, action: 'USER_CREATED', entity_type: 'user', entity_id: 1, old_values: null, new_values: JSON.stringify({ email: 'admin@bloodbank.com', role: 'admin' }), ip_address: '127.0.0.1', created_at: '2024-10-01 08:00:00' },
  { id: 2, user_id: 1, action: 'SCHEDULER_CONFIG_UPDATED', entity_type: 'scheduler_config', entity_id: 1, old_values: null, new_values: JSON.stringify({ algorithm: 'FCFS' }), ip_address: '127.0.0.1', created_at: '2024-10-01 08:10:00' }
];

class EmbeddedDatabase {
  constructor() {
    this.loadState();
  }

  loadState() {
    if (fs.existsSync(STATE_FILE)) {
      try {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        const data = JSON.parse(raw);
        this.blood_groups = data.blood_groups || INITIAL_BLOOD_GROUPS;
        this.users = data.users || INITIAL_USERS;
        this.donors = data.donors || INITIAL_DONORS;
        this.donation_slots = data.donation_slots || INITIAL_SLOTS;
        this.appointments = data.appointments || INITIAL_APPOINTMENTS;
        this.donation_records = data.donation_records || INITIAL_DONATION_RECORDS;
        this.blood_inventory = data.blood_inventory || INITIAL_INVENTORY;
        this.blood_requests = data.blood_requests || INITIAL_REQUESTS;
        this.scheduler_config = data.scheduler_config || INITIAL_SCHEDULER_CONFIG;
        this.audit_logs = data.audit_logs || INITIAL_AUDIT_LOGS;
        return;
      } catch (e) {
        console.warn('Could not read saved state, resetting to initial seed:', e.message);
      }
    }

    this.blood_groups = JSON.parse(JSON.stringify(INITIAL_BLOOD_GROUPS));
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.donors = JSON.parse(JSON.stringify(INITIAL_DONORS));
    this.donation_slots = JSON.parse(JSON.stringify(INITIAL_SLOTS));
    this.appointments = JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS));
    this.donation_records = JSON.parse(JSON.stringify(INITIAL_DONATION_RECORDS));
    this.blood_inventory = JSON.parse(JSON.stringify(INITIAL_INVENTORY));
    this.blood_requests = JSON.parse(JSON.stringify(INITIAL_REQUESTS));
    this.scheduler_config = JSON.parse(JSON.stringify(INITIAL_SCHEDULER_CONFIG));
    this.audit_logs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    this.saveState();
  }

  saveState() {
    try {
      const state = {
        blood_groups: this.blood_groups,
        users: this.users,
        donors: this.donors,
        donation_slots: this.donation_slots,
        appointments: this.appointments,
        donation_records: this.donation_records,
        blood_inventory: this.blood_inventory,
        blood_requests: this.blood_requests,
        scheduler_config: this.scheduler_config,
        audit_logs: this.audit_logs
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving database state:', e.message);
    }
  }

  // Handle queries
  async query(sql, params = []) {
    return this.execute(sql, params);
  }

  async execute(sql, params = []) {
    const s = sql.trim();
    const upper = s.toUpperCase();

    // 1. SELECT users by email
    if (upper.includes('FROM USERS WHERE EMAIL = ?')) {
      const email = params[0];
      const match = this.users.filter(u => u.email.toLowerCase() === email.toLowerCase());
      return [match, []];
    }

    // 2. INSERT INTO users
    if (upper.startsWith('INSERT INTO USERS')) {
      const [email, password_hash, role, first_name, last_name, phone] = params;
      const id = this.users.length ? Math.max(...this.users.map(u => u.id)) + 1 : 1;
      const user = { id, email, password_hash, role, first_name, last_name, phone: phone || null, is_active: 1 };
      this.users.push(user);
      this.saveState();
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // 3. SELECT blood_groups
    if (upper.includes('FROM BLOOD_GROUPS WHERE GROUP_NAME = ?')) {
      const gname = params[0];
      const match = this.blood_groups.filter(b => b.group_name === gname);
      return [match, []];
    }

    if (upper.includes('FROM BLOOD_GROUPS') && !upper.includes('LEFT JOIN') && !upper.includes('COUNT(')) {
      return [this.blood_groups, []];
    }

    if (upper.includes('SELECT COUNT(*) AS CNT FROM BLOOD_GROUPS')) {
      return [[{ cnt: this.blood_groups.length }], []];
    }

    // 4. INSERT INTO donors
    if (upper.startsWith('INSERT INTO DONORS')) {
      const [user_id, blood_group_id, date_of_birth, gender, address] = params;
      const id = this.donors.length ? Math.max(...this.donors.map(d => d.id)) + 1 : 1;
      const donor = {
        id,
        user_id,
        blood_group_id,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        address: address || null,
        medical_notes: null,
        last_donation_date: null,
        total_donations: 0,
        status: 'registered',
        created_at: new Date().toISOString()
      };
      this.donors.push(donor);
      this.saveState();
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // 5. SELECT donors for current user (me)
    if (upper.includes('FROM DONORS D') && upper.includes('WHERE D.USER_ID = ?')) {
      const userId = params[0];
      const match = this.donors.filter(d => d.user_id === userId).map(d => {
        const u = this.users.find(u => u.id === d.user_id) || {};
        const bg = this.blood_groups.find(b => b.id === d.blood_group_id) || {};
        return {
          id: d.id,
          user_id: d.user_id,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          phone: u.phone,
          blood_group: bg.group_name,
          date_of_birth: d.date_of_birth,
          gender: d.gender,
          address: d.address,
          medical_notes: d.medical_notes,
          last_donation_date: d.last_donation_date,
          total_donations: d.total_donations,
          status: d.status
        };
      });
      return [match, []];
    }

    // 6. SELECT donors list with filters
    if (upper.includes('FROM DONORS D') && upper.includes('JOIN USERS U') && upper.includes('JOIN BLOOD_GROUPS BG')) {
      // Check if this is compatibility query (WHERE BG.GROUP_NAME IN)
      if (upper.includes('BG.GROUP_NAME IN (?)')) {
        const groups = Array.isArray(params[0]) ? params[0] : [params[0]];
        const match = this.donors
          .filter(d => d.status === 'active')
          .map(d => {
            const u = this.users.find(u => u.id === d.user_id) || {};
            const bg = this.blood_groups.find(b => b.id === d.blood_group_id) || {};
            return {
              id: d.id,
              first_name: u.first_name,
              last_name: u.last_name,
              phone: u.phone,
              blood_group: bg.group_name,
              status: d.status,
              last_donation_date: d.last_donation_date,
              total_donations: d.total_donations
            };
          })
          .filter(d => groups.includes(d.blood_group))
          .slice(0, 15);
        return [match, []];
      }

      // General donors list
      let list = this.donors.map(d => {
        const u = this.users.find(u => u.id === d.user_id) || {};
        const bg = this.blood_groups.find(b => b.id === d.blood_group_id) || {};
        return {
          id: d.id,
          user_id: d.user_id,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          phone: u.phone,
          blood_group: bg.group_name,
          date_of_birth: d.date_of_birth,
          gender: d.gender,
          address: d.address,
          medical_notes: d.medical_notes,
          last_donation_date: d.last_donation_date,
          total_donations: d.total_donations,
          status: d.status,
          created_at: d.created_at
        };
      });

      // Filter params if present
      let pIdx = 0;
      if (upper.includes('BG.GROUP_NAME = ?')) {
        const bgFilter = params[pIdx++];
        list = list.filter(d => d.blood_group === bgFilter);
      }
      if (upper.includes('D.STATUS = ?')) {
        const statFilter = params[pIdx++];
        list = list.filter(d => d.status === statFilter);
      }
      if (upper.includes('LIKE ?')) {
        const search = (params[pIdx++] || '').replace(/%/g, '').toLowerCase();
        list = list.filter(d => (d.first_name && d.first_name.toLowerCase().includes(search)) ||
                                (d.last_name && d.last_name.toLowerCase().includes(search)) ||
                                (d.email && d.email.toLowerCase().includes(search)));
      }

      list.sort((a, b) => b.id - a.id);
      return [list, []];
    }

    // 7. SELECT COUNT(*) FROM donors
    if (upper.includes('SELECT COUNT(*) AS TOTAL FROM DONORS') || upper.includes('SELECT COUNT(*) AS CNT FROM DONORS')) {
      return [[{ total: this.donors.length, cnt: this.donors.length }], []];
    }

    // 8. SELECT id FROM donors WHERE user_id = ?
    if (upper.includes('FROM DONORS WHERE USER_ID = ?')) {
      const uid = params[0];
      const match = this.donors.filter(d => d.user_id === uid);
      return [match, []];
    }

    // 9. SELECT donation_records history
    if (upper.includes('FROM DONATION_RECORDS DR')) {
      if (upper.includes('LIMIT 5')) {
        const list = this.donation_records.slice(-5).reverse().map(dr => {
          const bg = this.blood_groups.find(b => b.id === dr.blood_group_id) || {};
          const d = this.donors.find(d => d.id === dr.donor_id) || {};
          const u = this.users.find(u => u.id === d.user_id) || {};
          return {
            id: dr.id,
            donation_date: dr.donation_date,
            units_donated: dr.units_donated,
            blood_group: bg.group_name,
            first_name: u.first_name,
            last_name: u.last_name,
            created_at: dr.created_at
          };
        });
        return [list, []];
      }

      // History for donor
      const donorId = params[0];
      const list = this.donation_records.filter(dr => !donorId || dr.donor_id === donorId).map(dr => {
        const bg = this.blood_groups.find(b => b.id === dr.blood_group_id) || {};
        const appt = this.appointments.find(a => a.id === dr.appointment_id) || {};
        const slot = this.donation_slots.find(s => s.id === appt.slot_id) || {};
        return {
          id: dr.id,
          donation_date: dr.donation_date,
          units_donated: dr.units_donated,
          hemoglobin_level: dr.hemoglobin_level,
          blood_pressure: dr.blood_pressure,
          temperature: dr.temperature,
          notes: dr.notes,
          blood_group: bg.group_name,
          location: slot.location,
          slot_date: slot.slot_date,
          start_time: slot.start_time
        };
      });
      return [list, []];
    }

    // Scheduler metrics queries
    if (upper.includes('TOTAL_CAPACITY') && upper.includes('DONATION_SLOTS')) {
      const total_capacity = this.donation_slots.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const booked_capacity = this.donation_slots.reduce((sum, s) => sum + ((s.capacity || 0) - (s.available_capacity || 0)), 0);
      return [[{ total_capacity, booked_capacity }], []];
    }

    if (upper.includes('TOTAL_APPOINTMENTS') && upper.includes('APPOINTMENTS') && upper.includes('CONFIRMED_COUNT')) {
      const total_appointments = this.appointments.length;
      const confirmed_count = this.appointments.filter(a => a.status === 'confirmed').length;
      const waiting_count = this.appointments.filter(a => a.status === 'waiting').length;
      const donated_count = this.appointments.filter(a => a.status === 'donated').length;
      const cancelled_count = this.appointments.filter(a => a.status === 'cancelled').length;
      const rejected_count = this.appointments.filter(a => a.status === 'rejected').length;
      return [[{ total_appointments, confirmed_count, waiting_count, donated_count, cancelled_count, rejected_count }], []];
    }

    // 10. SELECT donation_slots
    if (upper.includes('FROM DONATION_SLOTS DS') || upper.startsWith('SELECT ID, CAPACITY, AVAILABLE_CAPACITY, STATUS FROM DONATION_SLOTS')) {
      if (upper.includes('WHERE ID = ?')) {
        const id = params[0];
        const match = this.donation_slots.filter(s => s.id === id);
        return [match, []];
      }

      let slots = this.donation_slots.map(ds => {
        const u = this.users.find(u => u.id === ds.created_by) || {};
        return {
          id: ds.id,
          slot_date: ds.slot_date,
          start_time: ds.start_time,
          end_time: ds.end_time,
          location: ds.location,
          capacity: ds.capacity,
          available_capacity: ds.available_capacity,
          status: ds.status,
          created_by_first: u.first_name,
          created_by_last: u.last_name,
          booked_count: ds.capacity - ds.available_capacity
        };
      });

      slots.sort((a, b) => (a.slot_date + a.start_time).localeCompare(b.slot_date + b.start_time));
      return [slots, []];
    }

    // 11. INSERT INTO donation_slots
    if (upper.startsWith('INSERT INTO DONATION_SLOTS')) {
      const [slot_date, start_time, end_time, location, capacity, available_capacity, created_by] = params;
      const id = this.donation_slots.length ? Math.max(...this.donation_slots.map(s => s.id)) + 1 : 1;
      const slot = {
        id,
        slot_date,
        start_time,
        end_time,
        location,
        capacity,
        available_capacity: available_capacity || capacity,
        status: 'open',
        created_by
      };
      this.donation_slots.push(slot);
      this.saveState();
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // 12. UPDATE donation_slots
    if (upper.startsWith('UPDATE DONATION_SLOTS SET AVAILABLE_CAPACITY = ?')) {
      const [newAvail, newStatus, id] = params;
      const slot = this.donation_slots.find(s => s.id === id);
      if (slot) {
        slot.available_capacity = newAvail;
        slot.status = newStatus;
        this.saveState();
      }
      return [{ affectedRows: 1 }, []];
    }

    // 13. SELECT appointments
    if (upper.includes('FROM APPOINTMENTS WHERE DONOR_ID = ? AND SLOT_ID = ?')) {
      const [donor_id, slot_id] = params;
      const match = this.appointments.filter(a => a.donor_id === donor_id && a.slot_id === slot_id && !['cancelled', 'rejected'].includes(a.status));
      return [match, []];
    }

    if (upper.includes('FROM APPOINTMENTS A') && upper.includes('JOIN DONATION_SLOTS DS')) {
      const donorId = params[0];
      const match = this.appointments.filter(a => !donorId || a.donor_id === donorId).map(a => {
        const slot = this.donation_slots.find(s => s.id === a.slot_id) || {};
        return {
          id: a.id,
          donor_id: a.donor_id,
          slot_id: a.slot_id,
          booking_time: a.booking_time,
          priority_level: a.priority_level,
          status: a.status,
          scheduling_algorithm: a.scheduling_algorithm,
          state_changed_at: a.state_changed_at,
          notes: a.notes,
          slot_date: slot.slot_date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          location: slot.location
        };
      });
      return [match, []];
    }

    // 14. Scheduler queue query
    if (upper.includes('FROM APPOINTMENTS A') && upper.includes("WHERE A.STATUS IN ('WAITING', 'CONFIRMED')")) {
      const queue = this.appointments.filter(a => ['waiting', 'confirmed'].includes(a.status)).map(a => {
        const d = this.donors.find(d => d.id === a.donor_id) || {};
        const u = this.users.find(u => u.id === d.user_id) || {};
        const bg = this.blood_groups.find(b => b.id === d.blood_group_id) || {};
        const slot = this.donation_slots.find(s => s.id === a.slot_id) || {};
        return {
          id: a.id,
          donor_id: a.donor_id,
          slot_id: a.slot_id,
          booking_time: a.booking_time,
          priority_level: a.priority_level,
          status: a.status,
          scheduling_algorithm: a.scheduling_algorithm,
          state_changed_at: a.state_changed_at,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          blood_group: bg.group_name,
          location: slot.location,
          slot_date: slot.slot_date,
          start_time: slot.start_time
        };
      });
      return [queue, []];
    }

    // 15. INSERT INTO appointments
    if (upper.startsWith('INSERT INTO APPOINTMENTS')) {
      const [donor_id, slot_id, priority_level, algorithm, notes] = params;
      const id = this.appointments.length ? Math.max(...this.appointments.map(a => a.id)) + 1 : 1;
      const appt = {
        id,
        donor_id,
        slot_id,
        booking_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        priority_level: priority_level || 5,
        status: 'confirmed',
        scheduling_algorithm: algorithm || 'FCFS',
        state_changed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: notes || null
      };
      this.appointments.push(appt);
      this.saveState();
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // 16. UPDATE appointments
    if (upper.startsWith('UPDATE APPOINTMENTS SET STATUS = ?')) {
      const [status, id] = params;
      const appt = this.appointments.find(a => a.id === id);
      if (appt) {
        appt.status = status;
        appt.state_changed_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
        this.saveState();
      }
      return [{ affectedRows: 1 }, []];
    }

    // 17. scheduler_config
    if (upper.includes('FROM SCHEDULER_CONFIG WHERE IS_ACTIVE = TRUE')) {
      const active = this.scheduler_config.filter(c => c.is_active);
      return [active.length ? [active[active.length - 1]] : [{ algorithm: 'FCFS', time_quantum: 3 }], []];
    }

    if (upper.startsWith('UPDATE SCHEDULER_CONFIG SET IS_ACTIVE = FALSE')) {
      this.scheduler_config.forEach(c => c.is_active = 0);
      this.saveState();
      return [{ affectedRows: 1 }, []];
    }

    if (upper.startsWith('INSERT INTO SCHEDULER_CONFIG')) {
      const [algorithm, time_quantum, updated_by] = params;
      const id = this.scheduler_config.length ? Math.max(...this.scheduler_config.map(c => c.id)) + 1 : 1;
      this.scheduler_config.push({ id, algorithm, time_quantum, is_active: 1, updated_by });
      this.saveState();
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // 18. Inventory overview
    if (upper.includes('FROM BLOOD_GROUPS BG') && upper.includes('LEFT JOIN BLOOD_INVENTORY BI')) {
      // Check if for compatibility: WHERE BG.GROUP_NAME IN (?)
      if (upper.includes('BG.GROUP_NAME IN (?)')) {
        const groups = Array.isArray(params[0]) ? params[0] : [params[0]];
        const summary = groups.map(gname => {
          const bg = this.blood_groups.find(b => b.group_name === gname);
          if (!bg) return { group_name: gname, units_available: 0, batch_count: 0 };
          const batches = this.blood_inventory.filter(bi => bi.blood_group_id === bg.id && bi.status === 'available');
          const units = batches.reduce((acc, b) => acc + (b.units_available || 0), 0);
          return {
            group_name: gname,
            units_available: units,
            batch_count: batches.length
          };
        });
        return [summary, []];
      }

      // Standard inventory summary across all 8 groups
      const summary = this.blood_groups.map(bg => {
        const batches = this.blood_inventory.filter(bi => bi.blood_group_id === bg.id && bi.status === 'available');
        const available_units = batches.reduce((acc, b) => acc + (b.units_available || 0), 0);
        const reserved_units = this.blood_inventory.filter(bi => bi.blood_group_id === bg.id && bi.status === 'reserved')
          .reduce((acc, b) => acc + (b.units_reserved || 0), 0);
        const earliest = batches.length ? batches.map(b => b.expiry_date).sort()[0] : null;

        return {
          id: bg.id,
          group_name: bg.group_name,
          description: bg.description,
          available_units,
          reserved_units,
          active_batches: batches.length,
          earliest_expiry: earliest
        };
      });
      return [summary, []];
    }

    // 19. Detailed inventory batches
    if (upper.includes('FROM BLOOD_INVENTORY BI') && upper.includes('JOIN BLOOD_GROUPS BG')) {
      const batches = this.blood_inventory.map(bi => {
        const bg = this.blood_groups.find(b => b.id === bi.blood_group_id) || {};
        return {
          id: bi.id,
          batch_number: bi.batch_number,
          blood_group: bg.group_name,
          units_available: bi.units_available,
          units_reserved: bi.units_reserved,
          expiry_date: bi.expiry_date,
          status: bi.status,
          created_at: bi.created_at,
          days_to_expiry: 30
        };
      });
      return [batches, []];
    }

    // 20. INSERT INTO donation_records / blood_inventory
    if (upper.startsWith('INSERT INTO DONATION_RECORDS')) {
      const id = this.donation_records.length ? Math.max(...this.donation_records.map(r => r.id)) + 1 : 1;
      this.donation_records.push({ id, ...params });
      this.saveState();
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    if (upper.startsWith('INSERT INTO BLOOD_INVENTORY')) {
      const id = this.blood_inventory.length ? Math.max(...this.blood_inventory.map(i => i.id)) + 1 : 1;
      this.blood_inventory.push({ id, ...params });
      this.saveState();
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // 21. blood_requests
    if (upper.includes('FROM BLOOD_REQUESTS BR')) {
      if (upper.includes('LIMIT 5')) {
        const list = this.blood_requests.slice(-5).reverse().map(br => {
          const bg = this.blood_groups.find(b => b.id === br.blood_group_id) || {};
          return {
            id: br.id,
            patient_name: br.patient_name,
            hospital_name: br.hospital_name,
            units_requested: br.units_requested,
            urgency: br.urgency,
            status: br.status,
            request_date: br.request_date,
            blood_group: bg.group_name
          };
        });
        return [list, []];
      }

      const list = this.blood_requests.map(br => {
        const bg = this.blood_groups.find(b => b.id === br.blood_group_id) || {};
        const u = this.users.find(u => u.id === br.requester_id) || {};
        return {
          id: br.id,
          requester_id: br.requester_id,
          blood_group_id: br.blood_group_id,
          blood_group: bg.group_name,
          units_requested: br.units_requested,
          units_fulfilled: br.status === 'fulfilled' ? br.units_requested : 0,
          urgency: br.urgency,
          patient_name: br.patient_name,
          hospital_name: br.hospital_name,
          reason: br.reason,
          status: br.status,
          request_date: br.request_date,
          fulfilled_date: br.fulfilled_date,
          notes: br.notes,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email
        };
      });
      return [list, []];
    }

    if (upper.startsWith('INSERT INTO BLOOD_REQUESTS')) {
      const [requester_id, blood_group_id, units_requested, urgency, patient_name, hospital_name, reason, notes] = params;
      const id = this.blood_requests.length ? Math.max(...this.blood_requests.map(r => r.id)) + 1 : 1;
      const req = {
        id,
        requester_id,
        blood_group_id,
        units_requested,
        urgency,
        patient_name,
        hospital_name,
        reason: reason || null,
        status: 'pending',
        request_date: new Date().toISOString().substring(0, 10),
        fulfilled_date: null,
        notes: notes || null
      };
      this.blood_requests.push(req);
      this.saveState();
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    if (upper.startsWith('UPDATE BLOOD_REQUESTS SET STATUS = ?')) {
      const [status, id] = params;
      const req = this.blood_requests.find(r => r.id === id);
      if (req) {
        req.status = status;
        this.saveState();
      }
      return [{ affectedRows: 1 }, []];
    }

    // 22. Admin dashboard overall counts
    if (upper.includes('(SELECT COUNT(*) FROM DONORS) AS TOTAL_DONORS')) {
      const total_donors = this.donors.length;
      const active_donors = this.donors.filter(d => d.status === 'active').length;
      const total_appointments = this.appointments.length;
      const confirmed_appointments = this.appointments.filter(a => a.status === 'confirmed').length;
      const waiting_appointments = this.appointments.filter(a => a.status === 'waiting').length;
      const completed_donations = this.appointments.filter(a => a.status === 'donated').length;
      const total_units_available = this.blood_inventory
        .filter(bi => bi.status === 'available')
        .reduce((sum, bi) => sum + (bi.units_available || 0), 0);
      const pending_requests = this.blood_requests.filter(r => r.status === 'pending').length;
      const fulfilled_requests = this.blood_requests.filter(r => r.status === 'fulfilled').length;

      return [[{
        total_donors,
        active_donors,
        total_appointments,
        confirmed_appointments,
        waiting_appointments,
        completed_donations,
        total_units_available,
        pending_requests,
        fulfilled_requests
      }], []];
    }

    // 23. Audit logs
    if (upper.startsWith('INSERT INTO AUDIT_LOGS')) {
      const [user_id, action, entity_type, entity_id, old_values, new_values, ip_address] = params;
      const id = this.audit_logs.length ? Math.max(...this.audit_logs.map(l => l.id)) + 1 : 1;
      this.audit_logs.push({
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
      this.saveState();
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    if (upper.includes('FROM AUDIT_LOGS AL')) {
      const logs = this.audit_logs.slice(-20).reverse().map(al => {
        const u = this.users.find(u => u.id === al.user_id) || {};
        return {
          ...al,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email
        };
      });
      return [logs, []];
    }

    // Default fallback
    console.log('[Embedded DB] Unhandled SQL, returning empty set:', sql.substring(0, 80));
    return [[], []];
  }

  async getConnection() {
    return {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      execute: (sql, params) => this.execute(sql, params),
      query: (sql, params) => this.execute(sql, params),
      release: () => {}
    };
  }
}

module.exports = new EmbeddedDatabase();
