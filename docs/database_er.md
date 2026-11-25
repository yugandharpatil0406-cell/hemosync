# Database Entity-Relationship (ER) Documentation

## 1. Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    users ||--o| donors : "has profile"
    users ||--o{ donation_slots : "creates"
    users ||--o{ donation_records : "staff attends"
    users ||--o{ blood_requests : "submits"
    users ||--o{ request_fulfilments : "fulfills"
    users ||--o{ audit_logs : "triggers"

    blood_groups ||--o{ donors : "belongs to"
    blood_groups ||--o{ donation_records : "recorded as"
    blood_groups ||--o{ blood_inventory : "categorizes"
    blood_groups ||--o{ blood_requests : "demanded as"

    donors ||--o{ appointments : "books"
    donation_slots ||--o{ appointments : "contains"

    appointments ||--o| donation_records : "results in"

    blood_requests ||--o{ request_fulfilments : "fulfilled by"
    blood_inventory ||--o{ request_fulfilments : "deducted from"

    users {
        int id PK
        string email UK
        string password_hash
        enum role
        string first_name
        string last_name
        string phone
        boolean is_active
        timestamp created_at
    }

    blood_groups {
        int id PK
        string group_name UK
        string description
    }

    donors {
        int id PK
        int user_id FK,UK
        int blood_group_id FK
        date date_of_birth
        enum gender
        text address
        int total_donations
        enum status
    }

    donation_slots {
        int id PK
        date slot_date
        time start_time
        time end_time
        string location
        int capacity
        int available_capacity
        enum status
        int created_by FK
    }

    appointments {
        int id PK
        int donor_id FK
        int slot_id FK
        timestamp booking_time
        int priority_level
        enum status
        enum scheduling_algorithm
        timestamp state_changed_at
    }

    donation_records {
        int id PK
        int appointment_id FK,UK
        int donor_id FK
        int blood_group_id FK
        decimal units_donated
        date donation_date
        decimal hemoglobin_level
        string blood_pressure
        decimal temperature
        int staff_id FK
    }

    blood_inventory {
        int id PK
        int blood_group_id FK
        string batch_number UK
        int units_available
        int units_reserved
        date expiry_date
        enum status
    }

    blood_requests {
        int id PK
        int requester_id FK
        int blood_group_id FK
        int units_requested
        enum urgency
        string patient_name
        string hospital_name
        enum status
        timestamp request_date
    }

    request_fulfilments {
        int id PK
        int request_id FK
        int inventory_id FK
        int units_fulfilled
        int fulfilled_by FK
        timestamp fulfilled_at
    }

    audit_logs {
        int id PK
        int user_id FK
        string action
        string entity_type
        int entity_id
        json old_values
        json new_values
        string ip_address
        timestamp created_at
    }

    scheduler_config {
        int id PK
        enum algorithm
        int time_quantum
        boolean is_active
        int updated_by FK
    }
```

---

## 2. Normalization Analysis (Targeting BCNF)

1. **First Normal Form (1NF)**:
   - All columns contain atomic, indivisible values.
   - Every table has a well-defined primary key.
   - No repeating groups or multivalued attributes.

2. **Second Normal Form (2NF)**:
   - Satisfies 1NF.
   - All non-key attributes are fully functionally dependent on the primary key. In tables with composite keys such as the unique constraint `uq_donor_slot(donor_id, slot_id)`, synthetic auto-increment primary keys (`appointments.id`) are used.

3. **Third Normal Form (3NF)**:
   - Satisfies 2NF.
   - Transitive dependencies are removed. Donor profile details (`blood_group_id`, `address`) are stored in `donors` and not duplicated inside `appointments`. Blood group information is strictly referenced through the `blood_groups` reference table.

4. **Boyce-Codd Normal Form (BCNF)**:
   - For every functional dependency $X \to Y$, $X$ is a superkey.
   - In `appointments`, the candidate keys are `id` and `(donor_id, slot_id)`. Both are unique and minimal superkeys.

---

## 3. Database Integrity & Constraints

- **Foreign Key Actions**:
  - `donors.user_id -> users.id`: `ON DELETE CASCADE`
  - `appointments.donor_id -> donors.id`: `ON DELETE CASCADE`
  - `appointments.slot_id -> donation_slots.id`: `ON DELETE CASCADE`
  - Reference tables like `blood_groups` enforce `ON DELETE RESTRICT` to prevent accidental loss of classification.

- **Check Constraints**:
  - `chk_capacity_positive`: `capacity > 0`
  - `chk_avail_capacity_valid`: `available_capacity >= 0 AND available_capacity <= capacity`
  - `chk_units_non_negative`: `units_available >= 0`
  - `chk_units_req_positive`: `units_requested > 0`
