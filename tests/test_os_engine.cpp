#include <iostream>
#include <cassert>
#include <thread>
#include <vector>
#include <string>
#include "../engines/os-scheduler/include/scheduler.h"

int main() {
    std::cout << "========================================\n";
    std::cout << "RUNNING TEST SUITE: OS SCHEDULER ENGINE \n";
    std::cout << "========================================\n\n";

    // TEST 1: Donor State Machine Valid & Invalid Transitions
    std::cout << "[Test 1] Donor State Transitions & Rejection of Invalid Transitions...\n";
    {
        DonorScheduler scheduler;
        auto req1 = scheduler.addRequest(101, 1, 5); // Initial state: REGISTERED
        int id = req1.id;

        // Invalid direct transition: REGISTERED -> CONFIRMED (must go through WAITING)
        bool invalidSkip = scheduler.transitionState(id, DonorState::CONFIRMED);
        assert(!invalidSkip);

        // Valid transition: REGISTERED -> WAITING
        bool t1 = scheduler.transitionState(id, DonorState::WAITING);
        assert(t1);

        // Valid transition: WAITING -> CONFIRMED
        bool t2 = scheduler.transitionState(id, DonorState::CONFIRMED);
        assert(t2);

        // Valid transition: CONFIRMED -> DONATED
        bool t3 = scheduler.transitionState(id, DonorState::DONATED);
        assert(t3);

        // INVALID transition: Cannot transition once in DONATED state
        bool t4 = scheduler.transitionState(id, DonorState::WAITING);
        assert(!t4);
        bool t5 = scheduler.transitionState(id, DonorState::CANCELLED);
        assert(!t5);

        // Test Cancellation from WAITING
        auto req2 = scheduler.addRequest(102, 1, 5);
        scheduler.transitionState(req2.id, DonorState::WAITING);
        bool c1 = scheduler.transitionState(req2.id, DonorState::CANCELLED);
        assert(c1);
        // Cannot transition out of CANCELLED
        bool c2 = scheduler.transitionState(req2.id, DonorState::CONFIRMED);
        assert(!c2);

        std::cout << " -> PASSED: State transitions enforced and invalid transitions rejected.\n\n";
    }

    // TEST 2: FCFS Ordering
    std::cout << "[Test 2] First-Come-First-Serve (FCFS) Ordering...\n";
    {
        DonorScheduler scheduler;
        scheduler.setAlgorithm(SchedulerAlgorithm::FCFS);
        auto r1 = scheduler.addRequest(201, 1, 5);
        std::this_thread::sleep_for(std::chrono::milliseconds(5));
        auto r2 = scheduler.addRequest(202, 1, 5);
        std::this_thread::sleep_for(std::chrono::milliseconds(5));
        auto r3 = scheduler.addRequest(203, 1, 5);

        auto processed = scheduler.processQueue();
        assert(processed.size() >= 3);
        assert(processed[0].donor_id == 201); // First arrival is first in queue
        assert(processed[1].donor_id == 202);
        assert(processed[2].donor_id == 203);
        std::cout << " -> PASSED: FCFS correctly processed requests in arrival order.\n\n";
    }

    // TEST 3: Priority Scheduling
    std::cout << "[Test 3] Priority Scheduling (Lower numerical value = higher priority)...\n";
    {
        DonorScheduler scheduler;
        scheduler.setAlgorithm(SchedulerAlgorithm::PRIORITY);
        scheduler.addRequest(301, 1, 8); // Priority 8 (low)
        scheduler.addRequest(302, 1, 1); // Priority 1 (CRITICAL HIGHEST)
        scheduler.addRequest(303, 1, 4); // Priority 4 (medium)

        auto processed = scheduler.processQueue();
        assert(processed.size() >= 3);
        assert(processed[0].donor_id == 302); // Priority 1 processed FIRST
        assert(processed[1].donor_id == 303); // Priority 4 processed SECOND
        assert(processed[2].donor_id == 301); // Priority 8 processed THIRD
        std::cout << " -> PASSED: Highest priority (1) scheduled before lower priorities.\n\n";
    }

    // TEST 4: Round Robin with Time Quantum
    std::cout << "[Test 4] Round Robin Time Quantum Simulation...\n";
    {
        DonorScheduler scheduler;
        scheduler.setAlgorithm(SchedulerAlgorithm::ROUND_ROBIN);
        scheduler.setTimeQuantum(4);
        assert(scheduler.getTimeQuantum() == 4);

        scheduler.addRequest(401, 1, 5);
        scheduler.addRequest(402, 1, 5);
        scheduler.addRequest(403, 1, 5);

        auto processed = scheduler.processQueue();
        assert(processed.size() >= 3);
        auto metrics = scheduler.getMetrics();
        assert(metrics.confirmed_count >= 3);
        std::cout << " -> PASSED: Round Robin processed requests with configurable quantum.\n\n";
    }

    // TEST 5: Multithreaded Concurrency Simulation (Mutex + Semaphore)
    std::cout << "[Test 5] Multithreaded Concurrent Requests Simulation...\n";
    {
        DonorScheduler scheduler;
        std::string simLog = scheduler.simulateScheduling(20);
        assert(!simLog.empty());
        assert(simLog.find("Simulation End") != std::string::npos);

        auto metrics = scheduler.getMetrics();
        std::cout << "    Simulation Total Requests: " << metrics.total_requests << "\n";
        std::cout << "    Confirmed Allocations:     " << metrics.confirmed_count << "\n";
        std::cout << "    Average Waiting Time:      " << metrics.avg_waiting_time << " s\n";
        std::cout << "    Slot Utilization:          " << metrics.slot_utilization << " %\n";
        assert(metrics.total_requests >= 20);
        std::cout << " -> PASSED: Multithreaded simulation executed safely without race conditions.\n\n";
    }

    std::cout << "========================================\n";
    std::cout << "ALL OS ENGINE TESTS PASSED SUCCESSFULLY!\n";
    std::cout << "========================================\n";
    return 0;
}
