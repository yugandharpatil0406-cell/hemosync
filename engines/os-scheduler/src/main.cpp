#include <iostream>

// Defined in scheduler_server.cpp
int runSchedulerServer(int port);

int main() {
    std::cout << "========================================" << std::endl;
    std::cout << "  Blood Bank - OS Scheduler Engine" << std::endl;
    std::cout << "  Starting on port 5001..." << std::endl;
    std::cout << "========================================" << std::endl;

    return runSchedulerServer(5001);
}
