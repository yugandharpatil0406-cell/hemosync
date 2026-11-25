# Blood Bank and Donor Slot Management System with Compatibility Matching (HemoSync)

A production-grade, end-to-end full-stack college mini project integrating four computer science engines into a unified medical blood bank platform.

---

## 1. Integrated Engines Overview

| Engine | Discipline | Technology | Core Features | Port |
| :--- | :--- | :--- | :--- | :--- |
| **Engine 01** | **OS Donor Slot Scheduler** | C++17, WinSock2, pthreads | FCFS, Priority & Round Robin scheduling; Mutex locks; Semaphore capacity control; Donor state transitions (REGISTERED $\to$ WAITING $\to$ CONFIRMED $\to$ DONATED) | `5001` |
| **Engine 02** | **DSA Compatibility Matcher** | C++17, WinSock2 | Directed graph with 8 blood groups (27 RBC compatibility edges); BFS & DFS traversals; AVL tree donor indexing ($O(\log N)$); Chained Hash Map ($O(1)$) | `5002` |
| **Engine 03** | **DBMS Inventory & Records** | MySQL 8.0+, InnoDB | BCNF normalization; ACID transactions; Row-level locking (`SELECT ... FOR UPDATE`); Duplicate booking prevention; Stored procedures & triggers | `3306` |
| **Engine 04** | **Web Control Dashboard** | React 18, Vite, Tailwind CSS, Axios, Express.js | 4 Role Dashboards (Donor, Staff, Admin, Requester); JWT authentication; BCrypt; Interactive visualizers for OS queue & DSA graph | `3000` (API) <br>`5173` (UI) |

---

## 2. User Roles & Demo Credentials

The database comes pre-seeded with 30 donors, 2 clinical staff members, 1 system administrator, 3 hospital requesters, donation slots, inventory, and sample requests.

| Role | Email Address | Password | Permissions & Dashboard Features |
| :--- | :--- | :--- | :--- |
| **Donor** | `donor1@bloodbank.com` | `password123` | View available slots, book appointments with priority, view status, cancel bookings, view donation history |
| **Blood Bank Staff** | `staff@bloodbank.com` | `password123` | View clinic donor queue, triage arrival, record physical donations with vitals (Hb, BP, Temp), commit blood units to inventory |
| **System Admin** | `admin@bloodbank.com` | `password123` | Switch scheduling algorithms (FCFS, Priority, Round Robin), view real-time engine metrics, trigger 50 concurrent requests simulation, manage users, view audit trail |
| **Blood Requester** | `requester@bloodbank.com` | `password123` | Submit hospital blood requests with urgency levels, test patient-to-donor compatibility, check live compatible stock, track fulfillment |

> **Note**: You can also use the **Quick Demo Login buttons** on the login page (`/login`) to switch between any of these roles with a single click!

---

## 3. Project Structure

```text
blood-bank-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/        # JWT authentication & Role-Based Access Control
│   │   ├── routes/            # REST API route handlers
│   │   │   ├── auth.js        # Login & registration
│   │   │   ├── donors.js      # Donor profiles & history
│   │   │   ├── slots.js       # Slot creation & listing
│   │   │   ├── appointments.js# ACID booking & state transitions
│   │   │   ├── scheduler.js   # Bridge to C++ OS engine
│   │   │   ├── compatibility.js# Bridge to C++ DSA engine
│   │   │   ├── inventory.js   # DBMS inventory & FIFO fulfillment
│   │   │   ├── requests.js    # Hospital blood requests
│   │   │   └── admin.js       # Metrics & audit logs
│   │   ├── utils/             # DB connection pool, JWT helper, audit logger
│   │   └── server.js          # Main Express server entry point
│   ├── .env                   # Environment configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Layout, Navbar, Sidebar, StatusBadge
│   │   │   ├── CompatibilityVisualizer.jsx # Interactive 8-group directed graph & BFS/DFS
│   │   │   └── SchedulerQueueVisualizer.jsx# Live queue, algorithm switcher & simulation
│   │   ├── context/           # AuthContext (JWT management)
│   │   ├── pages/             # Donor, Staff, Admin, Requester Dashboards
│   │   ├── services/          # Axios HTTP client with interceptors
│   │   ├── App.jsx            # React Router route tree with guards
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── engines/
│   ├── os-scheduler/          # ENGINE 01 (C++17)
│   │   ├── include/scheduler.h
│   │   ├── src/scheduler.cpp
│   │   ├── src/scheduler_server.cpp
│   │   ├── src/main.cpp
│   │   ├── CMakeLists.txt
│   │   └── scheduler_engine.exe
│   └── dsa-compatibility/     # ENGINE 02 (C++17)
│       ├── include/compatibility.h
│       ├── src/compatibility.cpp
│       ├── src/compatibility_server.cpp
│       ├── src/main.cpp
│       ├── CMakeLists.txt
│       └── compatibility_engine.exe
├── database/
│   ├── schema.sql             # BCNF schema, constraints, stored procedures, triggers
│   └── seed.sql               # 30 donors, 8 blood groups, inventory, slots, requests
├── tests/
│   ├── test_os_engine.cpp     # Multithreading, mutex, semaphores, transitions unit test
│   ├── test_dsa_engine.cpp    # 8 blood groups RBC rules, BFS, DFS, AVL, hash map unit test
│   ├── test_dbms.js           # ACID rollback, double-booking prevention, FK test
│   └── test_api.js            # REST API integration & RBAC tests
├── docs/
│   ├── architecture.md        # Architectural diagrams & inter-engine protocols
│   └── database_er.md         # Mermaid ER diagram & normalization proofs
├── start-all.bat              # One-click launch script for all engines and UI
└── README.md
```

---

## 4. Setup & Running Instructions

### Prerequisites
- **Node.js** (v18+ recommended; v24 installed)
- **MinGW-W64 / GCC C++17** (C++ engines come pre-compiled as standalone `.exe` executables)
- **MySQL / MariaDB** (Port 3306)

---

### Step 1: Database Setup
1. Start your local MySQL service (e.g. via XAMPP or MySQL Server).
2. Create the database and import the schema and seed data:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```
*(If your MySQL root user has no password, omit the `-p` flag)*.

---

### Step 2: Start C++ Engines (OS Scheduler & DSA Matcher)

Open two terminal windows:

**Terminal 1 - Engine 01 (OS Scheduler):**
```bash
cd engines/os-scheduler
./scheduler_engine.exe 5001
```
*Listens on `http://localhost:5001`*

**Terminal 2 - Engine 02 (DSA Compatibility):**
```bash
cd engines/dsa-compatibility
./compatibility_engine.exe 5002
```
*Listens on `http://localhost:5002`*

*(Optional) To recompile the C++ engines manually:*
```bash
# OS Scheduler
g++ -static -std=c++17 -Iinclude src/scheduler.cpp src/scheduler_server.cpp src/main.cpp -o scheduler_engine.exe -lws2_32 -lpthread

# DSA Matcher
g++ -static -std=c++17 -Iinclude src/compatibility.cpp src/compatibility_server.cpp src/main.cpp -o compatibility_engine.exe -lws2_32
```

---

### Step 3: Start Node.js Backend

**Terminal 3 - Backend API:**
```bash
cd backend
npm start
```
*Runs on `http://localhost:3000`*

---

### Step 4: Start React Frontend

**Terminal 4 - Frontend Web Application:**
```bash
cd frontend
npm run dev
```
*Opens on `http://localhost:5173`*

---

### Easy Launch: One-Click Startup Script

On Windows, simply double-click `start-all.bat` or run:
```bat
start-all.bat
```
This automatically launches both C++ engines, the Node.js backend server, and the Vite frontend application.

---

## 5. Verification & Running Test Suites

Run each engine test suite independently:

### 1. Test DSA Compatibility Engine (C++):
```bash
g++ -static -std=c++17 -Iengines/dsa-compatibility/include engines/dsa-compatibility/src/compatibility.cpp tests/test_dsa_engine.cpp -o tests/test_dsa_engine.exe
./tests/test_dsa_engine.exe
```
*Verifies: Universal Donor (O-), Universal Recipient (AB+), all 8 blood groups red cell compatibility, rejection of incompatible transfers, Graph BFS traversal, DFS traversal, AVL tree insertion/search, and BloodHashMap $O(1)$ lookups.*

### 2. Test OS Donor Slot Scheduler (C++):
```bash
g++ -static -std=c++17 -Iengines/os-scheduler/include engines/os-scheduler/src/scheduler.cpp tests/test_os_engine.cpp -o tests/test_os_engine.exe -lws2_32 -lpthread
./tests/test_os_engine.exe
```
*Verifies: Donor state machine transitions, FCFS ordering, Priority scheduling ordering, Round Robin simulation, and 50 simultaneous threads competing for a single slot with mutex and semaphore protection.*

### 3. Test DBMS Engine (JavaScript / MySQL):
```bash
cd tests
node test_dbms.js
```
*Verifies: Schema normalization, foreign key cascade actions, double-booking prevention, and ACID transaction rollbacks.*

### 4. Test Web REST APIs & RBAC:
```bash
cd tests
node test_api.js
```
*Verifies: JWT token generation, role-based authorization, slot booking, and C++ engine API responses.*

---

## 6. Red Blood Cell Compatibility Reference Rules

| Donor Group | Can Donate Red Blood Cells To |
| :--- | :--- |
| **O-** (Universal Donor) | **All Blood Groups** (A+, A-, B+, B-, AB+, AB-, O+, O-) |
| **O+** | A+, B+, AB+, O+ |
| **A-** | A+, A-, AB+, AB- |
| **A+** | A+, AB+ |
| **B-** | B+, B-, AB+, AB- |
| **B+** | B+, AB+ |
| **AB-** | AB+, AB- |
| **AB+** (Universal Recipient)| AB+ Only |
