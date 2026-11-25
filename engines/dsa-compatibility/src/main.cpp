#include <iostream>

void runCompatibilityServer(int port);

int main(int argc, char* argv[]) {
    int port = 5002;
    if (argc > 1) {
        port = std::stoi(argv[1]);
    }
    std::cout << "========================================================\n";
    std::cout << "  ENGINE 02: DSA BLOOD COMPATIBILITY MATCHER (C++17)    \n";
    std::cout << "  - Directed Graph for 8 Blood Groups (RBC Compatibility)\n";
    std::cout << "  - BFS & DFS Graph Traversals                           \n";
    std::cout << "  - Balanced AVL Tree for Donor Indexing                 \n";
    std::cout << "  - Hash Maps with Chaining for O(1) Blood Group Lookup  \n";
    std::cout << "========================================================\n";
    runCompatibilityServer(port);
    return 0;
}
