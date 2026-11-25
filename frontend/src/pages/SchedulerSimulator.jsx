import React from 'react';
import { SchedulerQueueVisualizer } from '../components/SchedulerQueueVisualizer';

export const SchedulerSimulator = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">ENGINE 01: OS Donor Slot Scheduler Engine</h2>
        <p className="text-xs text-slate-500 mt-1">
          Multithreaded C++ engine featuring FCFS, Priority, and Round Robin scheduling algorithms, mutex lock critical sections, semaphore capacity bounding, and donor state transition validation.
        </p>
      </div>
      <SchedulerQueueVisualizer />
    </div>
  );
};
