#include "scheduler.h"
#include <algorithm>
#include <sstream>
#include <thread>
#include <chrono>
#include <cstring>
#include <random>
#include <functional>

// ─────────────────────────────────────────────────────────────────────────────
// Construction / Destruction
// ─────────────────────────────────────────────────────────────────────────────
DonorScheduler::DonorScheduler()
    : sem_count_(100), sem_max_(100),
      algorithm_(SchedulerAlgorithm::FCFS),
      time_quantum_(3), next_id_(1),
      confirmed_count_(0), rejected_count_(0), total_waiting_time_(0.0)
{}

DonorScheduler::~DonorScheduler() = default;

// ─────────────────────────────────────────────────────────────────────────────
// Semaphore helpers
// ─────────────────────────────────────────────────────────────────────────────
void DonorScheduler::semWait() {
    std::unique_lock<std::mutex> lk(sem_mtx_);
    if (!sem_cv_.wait_for(lk, std::chrono::milliseconds(200), [this]{ return sem_count_ > 0; })) {
        return; // timed out without slot, proceed safely
    }
    if (sem_count_ > 0) {
        --sem_count_;
    }
}

void DonorScheduler::semSignal() {
    std::lock_guard<std::mutex> lk(sem_mtx_);
    if (sem_count_ < sem_max_) {
        ++sem_count_;
    }
    sem_cv_.notify_one();
}

// ─────────────────────────────────────────────────────────────────────────────
// State helpers
// ─────────────────────────────────────────────────────────────────────────────
std::string DonorScheduler::getStateString(DonorState state) {
    switch (state) {
        case DonorState::REGISTERED: return "REGISTERED";
        case DonorState::WAITING:    return "WAITING";
        case DonorState::CONFIRMED:  return "CONFIRMED";
        case DonorState::DONATED:    return "DONATED";
        case DonorState::CANCELLED:  return "CANCELLED";
    }
    return "UNKNOWN";
}

DonorState DonorScheduler::stateFromString(const std::string& s) {
    if (s == "REGISTERED") return DonorState::REGISTERED;
    if (s == "WAITING")    return DonorState::WAITING;
    if (s == "CONFIRMED")  return DonorState::CONFIRMED;
    if (s == "DONATED")    return DonorState::DONATED;
    if (s == "CANCELLED")  return DonorState::CANCELLED;
    return DonorState::REGISTERED; // fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// addRequest  (thread-safe, semaphore-guarded)
// ─────────────────────────────────────────────────────────────────────────────
DonorRequest DonorScheduler::addRequest(int donor_id, int slot_id, int priority) {
    // Acquire a semaphore slot (blocks if all slots are full)
    semWait();

    std::lock_guard<std::mutex> lk(mtx_);

    DonorRequest req{};
    req.id              = next_id_++;
    req.donor_id        = donor_id;
    req.slot_id         = slot_id;
    req.priority        = priority;
    req.state           = DonorState::REGISTERED;
    req.arrival_time    = std::time(nullptr);
    req.completion_time = 0;
    req.waiting_time    = 0.0;

    request_queue_.push_back(req);
    return req;
}

// ─────────────────────────────────────────────────────────────────────────────
// transitionState
// Valid: REGISTERED→WAITING→CONFIRMED→DONATED
//        any (except DONATED) → CANCELLED
// ─────────────────────────────────────────────────────────────────────────────
bool DonorScheduler::transitionState(int request_id, DonorState new_state) {
    std::lock_guard<std::mutex> lk(mtx_);

    for (auto& req : request_queue_) {
        if (req.id == request_id) {
            DonorState cur = req.state;

            // Cannot transition from DONATED or CANCELLED
            if (cur == DonorState::DONATED || cur == DonorState::CANCELLED) {
                return false;
            }

            // Cancellation is always allowed (except from DONATED, handled above)
            if (new_state == DonorState::CANCELLED) {
                req.state = DonorState::CANCELLED;
                req.completion_time = std::time(nullptr);
                rejected_count_++;
                semSignal(); // release semaphore slot
                return true;
            }

            // Normal forward transitions
            bool valid = false;
            if (cur == DonorState::REGISTERED && new_state == DonorState::WAITING)   valid = true;
            if (cur == DonorState::WAITING    && new_state == DonorState::CONFIRMED)  valid = true;
            if (cur == DonorState::CONFIRMED  && new_state == DonorState::DONATED)    valid = true;

            if (valid) {
                req.state = new_state;
                if (new_state == DonorState::DONATED) {
                    req.completion_time = std::time(nullptr);
                    req.waiting_time = difftime(req.completion_time, req.arrival_time);
                    total_waiting_time_ += req.waiting_time;
                    confirmed_count_++;
                    semSignal(); // release semaphore slot
                }
                return true;
            }
            return false;
        }
    }
    return false; // request not found
}

// ─────────────────────────────────────────────────────────────────────────────
// processQueue
// ─────────────────────────────────────────────────────────────────────────────
std::vector<DonorRequest> DonorScheduler::processQueue() {
    std::lock_guard<std::mutex> lk(mtx_);

    switch (algorithm_) {
        case SchedulerAlgorithm::FCFS:        processFCFS();       break;
        case SchedulerAlgorithm::PRIORITY:    processPriority();   break;
        case SchedulerAlgorithm::ROUND_ROBIN: processRoundRobin(); break;
    }

    return request_queue_;
}

// ─── FCFS ────────────────────────────────────────────────────────────────────
void DonorScheduler::processFCFS() {
    // Sort by arrival_time
    std::stable_sort(request_queue_.begin(), request_queue_.end(),
        [](const DonorRequest& a, const DonorRequest& b) {
            return a.arrival_time < b.arrival_time;
        });

    time_t now = std::time(nullptr);
    int order = 0;
    for (auto& req : request_queue_) {
        if (req.state == DonorState::REGISTERED) {
            req.state = DonorState::WAITING;
        }
        if (req.state == DonorState::WAITING) {
            req.state = DonorState::CONFIRMED;
        }
        if (req.state == DonorState::CONFIRMED) {
            req.state = DonorState::DONATED;
            req.completion_time = now + order;
            req.waiting_time = difftime(req.completion_time, req.arrival_time);
            total_waiting_time_ += req.waiting_time;
            confirmed_count_++;
            semSignal();
        }
        order++;
    }
}

// ─── Priority ────────────────────────────────────────────────────────────────
void DonorScheduler::processPriority() {
    // Sort by priority (lower number = higher priority), then by arrival
    std::stable_sort(request_queue_.begin(), request_queue_.end(),
        [](const DonorRequest& a, const DonorRequest& b) {
            if (a.priority != b.priority) return a.priority < b.priority;
            return a.arrival_time < b.arrival_time;
        });

    time_t now = std::time(nullptr);
    int order = 0;
    for (auto& req : request_queue_) {
        if (req.state == DonorState::REGISTERED) {
            req.state = DonorState::WAITING;
        }
        if (req.state == DonorState::WAITING) {
            req.state = DonorState::CONFIRMED;
        }
        if (req.state == DonorState::CONFIRMED) {
            req.state = DonorState::DONATED;
            req.completion_time = now + order;
            req.waiting_time = difftime(req.completion_time, req.arrival_time);
            total_waiting_time_ += req.waiting_time;
            confirmed_count_++;
            semSignal();
        }
        order++;
    }
}

// ─── Round Robin ─────────────────────────────────────────────────────────────
void DonorScheduler::processRoundRobin() {
    time_t now = std::time(nullptr);
    int quantum = time_quantum_;
    int total_time = 0;

    // Collect indices of active requests
    std::vector<size_t> active;
    for (size_t i = 0; i < request_queue_.size(); i++) {
        auto& req = request_queue_[i];
        if (req.state == DonorState::REGISTERED) {
            req.state = DonorState::WAITING;
        }
        if (req.state == DonorState::WAITING || req.state == DonorState::CONFIRMED) {
            active.push_back(i);
        }
    }

    // Simulate round-robin passes
    int passes = 0;
    int max_passes = quantum * (int)active.size() + 1; // safety bound
    while (!active.empty() && passes < max_passes) {
        std::vector<size_t> still_active;
        for (auto idx : active) {
            auto& req = request_queue_[idx];
            total_time += quantum;

            if (req.state == DonorState::WAITING) {
                req.state = DonorState::CONFIRMED;
                still_active.push_back(idx);
            } else if (req.state == DonorState::CONFIRMED) {
                req.state = DonorState::DONATED;
                req.completion_time = now + total_time;
                req.waiting_time = difftime(req.completion_time, req.arrival_time);
                total_waiting_time_ += req.waiting_time;
                confirmed_count_++;
                semSignal();
                // not added to still_active — done
            }
        }
        active = still_active;
        passes++;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// getQueue
// ─────────────────────────────────────────────────────────────────────────────
std::vector<DonorRequest> DonorScheduler::getQueue() const {
    std::lock_guard<std::mutex> lk(mtx_);
    return request_queue_;
}

// ─────────────────────────────────────────────────────────────────────────────
// getMetrics
// ─────────────────────────────────────────────────────────────────────────────
SchedulerMetrics DonorScheduler::getMetrics() const {
    std::lock_guard<std::mutex> lk(mtx_);

    SchedulerMetrics m{};
    m.total_requests  = static_cast<int>(request_queue_.size());
    m.confirmed_count = confirmed_count_;
    m.rejected_count  = rejected_count_;
    m.avg_waiting_time = (confirmed_count_ > 0)
                         ? (total_waiting_time_ / confirmed_count_)
                         : 0.0;
    m.slot_utilization = (sem_max_ > 0)
                         ? (static_cast<double>(sem_max_ - sem_count_) / sem_max_) * 100.0
                         : 0.0;
    return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────
void DonorScheduler::setAlgorithm(SchedulerAlgorithm algo) {
    std::lock_guard<std::mutex> lk(mtx_);
    algorithm_ = algo;
}

void DonorScheduler::setTimeQuantum(int quantum) {
    std::lock_guard<std::mutex> lk(mtx_);
    if (quantum > 0) time_quantum_ = quantum;
}

SchedulerAlgorithm DonorScheduler::getAlgorithm() const {
    std::lock_guard<std::mutex> lk(mtx_);
    return algorithm_;
}

int DonorScheduler::getTimeQuantum() const {
    std::lock_guard<std::mutex> lk(mtx_);
    return time_quantum_;
}

// ─────────────────────────────────────────────────────────────────────────────
// simulateScheduling — spawns N threads, each adding a request
// ─────────────────────────────────────────────────────────────────────────────
std::string DonorScheduler::simulateScheduling(int num_requests) {
    if (num_requests <= 0) num_requests = 5;
    if (num_requests > 100) num_requests = 100;

    std::ostringstream log;
    log << "=== Simulation Start (" << num_requests << " concurrent requests) ===\n";

    // Snapshot initial state
    int initial_size = 0;
    {
        std::lock_guard<std::mutex> lk(mtx_);
        initial_size = static_cast<int>(request_queue_.size());
    }

    // Spawn threads that concurrently add requests
    std::vector<std::thread> threads;
    std::mutex log_mtx;
    std::mt19937 rng(static_cast<unsigned>(std::time(nullptr)));

    for (int i = 0; i < num_requests; i++) {
        threads.emplace_back([this, i, &log, &log_mtx, &rng]() {
            int donor_id = 1000 + i;
            int slot_id  = (i % 5) + 1;
            int priority = (i % 5) + 1;

            auto req = addRequest(donor_id, slot_id, priority);

            {
                std::lock_guard<std::mutex> llk(log_mtx);
                log << "  Thread " << i << ": Added request #" << req.id
                    << " (donor=" << donor_id << ", slot=" << slot_id
                    << ", priority=" << priority << ")\n";
            }

            // Small sleep to simulate staggered arrivals
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        });
    }

    for (auto& t : threads) t.join();

    log << "All threads completed. Processing queue...\n";

    // Process the queue
    auto results = processQueue();

    log << "Processed " << results.size() << " total requests.\n";

    // Gather metrics
    auto m = getMetrics();
    log << "Metrics: avg_wait=" << m.avg_waiting_time
        << "s, utilization=" << m.slot_utilization
        << "%, confirmed=" << m.confirmed_count
        << ", rejected=" << m.rejected_count
        << ", total=" << m.total_requests << "\n";

    log << "=== Simulation End ===\n";
    return log.str();
}
