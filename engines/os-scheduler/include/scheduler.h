#ifndef SCHEDULER_H
#define SCHEDULER_H

#include <string>
#include <vector>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <ctime>
#include <atomic>

// ─── Donor state machine ────────────────────────────────────────────────────
enum class DonorState {
    REGISTERED,
    WAITING,
    CONFIRMED,
    DONATED,
    CANCELLED
};

// ─── Scheduling algorithms ─────────────────────────────────────────────────
enum class SchedulerAlgorithm {
    FCFS,
    PRIORITY,
    ROUND_ROBIN
};

// ─── Data structures ────────────────────────────────────────────────────────
struct DonorRequest {
    int id;
    int donor_id;
    int slot_id;
    int priority;          // lower = higher priority
    DonorState state;
    time_t arrival_time;
    time_t completion_time;
    double waiting_time;   // seconds
};

struct SlotInfo {
    int id;
    int capacity;
    int booked;
};

struct SchedulerMetrics {
    double avg_waiting_time;
    double slot_utilization;
    int confirmed_count;
    int rejected_count;
    int total_requests;
};

// ─── Main scheduler class ───────────────────────────────────────────────────
class DonorScheduler {
public:
    DonorScheduler();
    ~DonorScheduler();

    // Core operations
    DonorRequest addRequest(int donor_id, int slot_id, int priority);
    std::vector<DonorRequest> processQueue();
    std::vector<DonorRequest> getQueue() const;
    SchedulerMetrics getMetrics() const;

    // Configuration
    void setAlgorithm(SchedulerAlgorithm algo);
    void setTimeQuantum(int quantum);
    SchedulerAlgorithm getAlgorithm() const;
    int getTimeQuantum() const;

    // State management
    static std::string getStateString(DonorState state);
    static DonorState stateFromString(const std::string& s);
    bool transitionState(int request_id, DonorState new_state);

    // Simulation
    std::string simulateScheduling(int num_requests);

private:
    mutable std::mutex mtx_;

    // Counting semaphore implemented with condition_variable + counter
    int sem_count_;
    int sem_max_;
    std::condition_variable sem_cv_;
    std::mutex sem_mtx_;

    void semWait();   // P / acquire
    void semSignal(); // V / release

    std::vector<DonorRequest> request_queue_;
    SchedulerAlgorithm algorithm_;
    int time_quantum_;
    int next_id_;

    // Internal metrics accumulators
    int confirmed_count_;
    int rejected_count_;
    double total_waiting_time_;

    // Process helpers (caller must hold mtx_)
    void processFCFS();
    void processPriority();
    void processRoundRobin();
};

#endif // SCHEDULER_H
