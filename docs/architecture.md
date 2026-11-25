# System Architecture Documentation

## Blood Bank and Donor Slot Management System with Compatibility Matching

### 1. Four Integrated Engines Overview

The system is architected around four distinct yet tightly coordinated engines representing core Computer Science disciplines:

```
+-----------------------------------------------------------------------------------+
|                           ENGINE 04: WEB CONTROL DASHBOARD                        |
|   React.js 18 + Vite + Tailwind CSS + Axios + React Router                        |
|   [Donor Portal]     [Staff Portal]     [Admin Portal]     [Requester Portal]     |
+-----------------------------------------------------------------------------------+
                                        | (REST APIs / JWT / JSON)
                                        v
+-----------------------------------------------------------------------------------+
|                           NODE.JS / EXPRESS.JS BACKEND                            |
|   REST Controllers, JWT Auth Middleware, RBAC Filters, Audit Logger, FIFO Dispatch |
+-----------------------------------------------------------------------------------+
         |                                |                                |
         | (HTTP / WinSock2)              | (HTTP / WinSock2)              | (MySQL Protocol)
         v                                v                                v
+-----------------------+     +-----------------------+     +-----------------------+
|      ENGINE 01:       |     |      ENGINE 02:       |     |      ENGINE 03:       |
|  OS DONOR SCHEDULER   |     |   DSA COMPATIBILITY   |     |    DBMS INVENTORY     |
|   (C++17 Standalone)  |     |   (C++17 Standalone)  |     |     (MySQL 8.0+)      |
|                       |     |                       |     |                       |
| * FCFS Scheduling     |     | * Directed Graph (8)  |     | * BCNF Normalized     |
| * Priority Scheduling |     | * Red Cell Rules (RBC)|     | * ACID Transactions   |
| * Round Robin (TQ)    |     | * BFS & DFS Order     |     | * SELECT FOR UPDATE   |
| * std::mutex Locks    |     | * AVL Tree Indexing   |     | * Double-Booking Check|
| * Capacity Semaphore  |     | * Hash Map Chaining   |     | * Stored Procedures   |
| * State Transitions   |     | * O(1) Bucket Lookup  |     | * Triggers & Audits   |
|   (Port 5001)         |     |   (Port 5002)         |     |   (Port 3306)         |
+-----------------------+     +-----------------------+     +-----------------------+
```

---

### 2. Engine Intercommunication Protocol

1. **Web Dashboard <-> Node.js Backend**:
   - Communication over standard HTTP JSON REST endpoints (`/api/*`).
   - Every protected request carries a `Bearer <JWT>` header verified by the authentication middleware.
   - Role-Based Access Control (RBAC) ensures users only access endpoints authorized for their assigned role (`donor`, `staff`, `admin`, `requester`).

2. **Node.js Backend <-> Engine 01 (OS Donor Slot Scheduler)**:
   - When a booking arrives, the Node.js backend notifies the C++ OS engine via `POST http://localhost:5001/api/scheduler/request`.
   - The C++ engine manages an internal multithreaded queue protected by `std::mutex` and custom semaphore constructs.
   - When the Admin changes scheduling policy (e.g. from FCFS to Priority or Round Robin with Time Quantum), Node.js sends a synchronization event to `POST http://localhost:5001/api/scheduler/algorithm`.
   - Queue state and metrics (`avg_waiting_time`, `slot_utilization`, `confirmed_count`, `rejected_count`) are polled via `GET http://localhost:5001/api/scheduler/metrics`.

3. **Node.js Backend <-> Engine 02 (DSA Compatibility Matcher)**:
   - Evaluates Red Blood Cell compatibility via `POST http://localhost:5002/api/compatibility/check`.
   - The C++ directed graph consists of 8 nodes representing all ABO/Rh blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) with 27 directed edges according to red blood cell transfusion rules.
   - BFS and DFS graph reachability traversals are accessed via `GET http://localhost:5002/api/compatibility/bfs` and `/dfs`.
   - Donor profiles are indexed into an AVL tree for $O(\log N)$ search and into a chained Hash Map for $O(1)$ group lookup.

4. **Node.js Backend <-> Engine 03 (DBMS Inventory and Records Manager)**:
   - Employs a connection pool (`mysql2/promise`) connecting to MySQL on port 3306.
   - Implements row-level locking via `SELECT ... FOR UPDATE` inside `START TRANSACTION ... COMMIT / ROLLBACK` blocks to prevent race conditions.
   - Updates blood stock in `blood_inventory` only after committed donations.
   - Deducts inventory during blood request fulfillments using FIFO (First-In, First-Out) by earliest expiry date.
   - Schema-level constraints (`UNIQUE KEY (donor_id, slot_id)`, `CHECK (available_capacity >= 0)`) ensure data integrity at the database layer.

---

### 3. Concurrency and Synchronization Design

```
Request Arrival
      |
      v
+-------------------------------+
| Mutex Lock Acquisition        |  <-- Prevents concurrent queue corruption
+-------------------------------+
      |
      v
+-------------------------------+
| Check Slot Semaphore Capacity |
+-------------------------------+
     /                         \
[Capacity > 0]             [Capacity == 0]
    |                              |
    v                              v
Allocate Slot (Capacity--)   Queue / Reject Request
State: CONFIRMED             State: WAITING or REJECTED
    |                              |
    +--------------+---------------+
                   |
                   v
+-------------------------------+
| Mutex Lock Released           |
+-------------------------------+
```

---

### 4. Donor State Machine

The OS Scheduler engine strictly enforces valid state transitions and rejects any invalid state progression:

```
    [ REGISTERED ]
          |
          v
      [ WAITING ] -------------> [ CANCELLED ]
          |                            ^
          v                            |
    [ CONFIRMED ] ---------------------+
          |
          v
      [ DONATED ] (Terminal State - Stock Created in DBMS)
```

Terminal states: `DONATED`, `CANCELLED`, `REJECTED`, `NO_SHOW`.
Once a donor reaches `DONATED`, their state is immutable to maintain audit and inventory traceability.
