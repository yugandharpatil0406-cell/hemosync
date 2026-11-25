#include <iostream>
#include <vector>
#include <string>
#include "../engines/dsa-compatibility/include/compatibility.h"

int main() {
    std::cout << "Starting DSA tests..." << std::endl;
    CompatibilityEngine engine;
    std::cout << "Engine initialized." << std::endl;

    bool r1 = engine.checkCompatibility(BloodGroup::O_NEG, BloodGroup::A_POS);
    std::cout << "O- to A+: " << r1 << std::endl;

    bool r2 = engine.checkCompatibility(BloodGroup::A_POS, BloodGroup::B_POS);
    std::cout << "A+ to B+: " << r2 << std::endl;

    auto bfs = engine.bfsTraversal(BloodGroup::O_NEG);
    std::cout << "BFS size: " << bfs.size() << std::endl;

    AVLTree<DonorInfo> avl;
    avl.insert(42, {42, "Dr. Alice", BloodGroup::O_POS, true});
    DonorInfo found;
    bool s1 = avl.search(42, found);
    std::cout << "AVL search 42: " << s1 << ", name: " << found.name << std::endl;

    BloodHashMap map;
    map.addDonor({1, "Test Donor 1", BloodGroup::A_POS, true});
    auto list = map.getDonors(BloodGroup::A_POS);
    std::cout << "Map count for A+: " << list.size() << std::endl;

    std::cout << "All done successfully!" << std::endl;
    return 0;
}
