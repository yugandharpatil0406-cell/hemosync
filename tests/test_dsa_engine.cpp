#include <iostream>
#include <cassert>
#include <vector>
#include <string>
#include "../engines/dsa-compatibility/include/compatibility.h"

int main() {
    std::cout << "========================================\n";
    std::cout << "RUNNING TEST SUITE: DSA COMPATIBILITY   \n";
    std::cout << "========================================\n\n";

    CompatibilityEngine engine;

    // TEST 1: Universal Donor (O-)
    std::cout << "[Test 1] Universal Donor O- Compatibility...\n";
    assert(engine.checkCompatibility(BloodGroup::O_NEG, BloodGroup::A_POS));
    assert(engine.checkCompatibility(BloodGroup::O_NEG, BloodGroup::A_NEG));
    assert(engine.checkCompatibility(BloodGroup::O_NEG, BloodGroup::B_POS));
    assert(engine.checkCompatibility(BloodGroup::O_NEG, BloodGroup::B_NEG));
    assert(engine.checkCompatibility(BloodGroup::O_NEG, BloodGroup::AB_POS));
    assert(engine.checkCompatibility(BloodGroup::O_NEG, BloodGroup::AB_NEG));
    assert(engine.checkCompatibility(BloodGroup::O_NEG, BloodGroup::O_POS));
    assert(engine.checkCompatibility(BloodGroup::O_NEG, BloodGroup::O_NEG));
    std::cout << " -> PASSED: O- can donate to all 8 blood groups.\n\n";

    // TEST 2: Universal Recipient (AB+)
    std::cout << "[Test 2] Universal Recipient AB+ Compatibility...\n";
    assert(engine.checkCompatibility(BloodGroup::A_POS, BloodGroup::AB_POS));
    assert(engine.checkCompatibility(BloodGroup::A_NEG, BloodGroup::AB_POS));
    assert(engine.checkCompatibility(BloodGroup::B_POS, BloodGroup::AB_POS));
    assert(engine.checkCompatibility(BloodGroup::B_NEG, BloodGroup::AB_POS));
    assert(engine.checkCompatibility(BloodGroup::AB_POS, BloodGroup::AB_POS));
    assert(engine.checkCompatibility(BloodGroup::AB_NEG, BloodGroup::AB_POS));
    assert(engine.checkCompatibility(BloodGroup::O_POS, BloodGroup::AB_POS));
    assert(engine.checkCompatibility(BloodGroup::O_NEG, BloodGroup::AB_POS));
    std::cout << " -> PASSED: AB+ can receive from all 8 blood groups.\n\n";

    // TEST 3: Incompatibility Rules (Never recommend incompatible blood)
    std::cout << "[Test 3] Rejection of Incompatible Blood Transfers...\n";
    assert(!engine.checkCompatibility(BloodGroup::A_POS, BloodGroup::B_POS));
    assert(!engine.checkCompatibility(BloodGroup::B_POS, BloodGroup::A_POS));
    assert(!engine.checkCompatibility(BloodGroup::AB_POS, BloodGroup::O_POS));
    assert(!engine.checkCompatibility(BloodGroup::O_POS, BloodGroup::O_NEG));
    assert(!engine.checkCompatibility(BloodGroup::A_POS, BloodGroup::O_POS));
    std::cout << " -> PASSED: Strictly rejected incompatible red cell transfers.\n\n";

    // TEST 4: Graph BFS Traversal
    std::cout << "[Test 4] Breadth First Search (BFS) Traversal...\n";
    auto bfs = engine.bfsTraversal(BloodGroup::O_NEG);
    assert(bfs.size() == 8); // O- can reach all 8 groups
    std::cout << " -> PASSED: BFS traversal visited all 8 groups from O- root.\n\n";

    // TEST 5: Graph DFS Traversal
    std::cout << "[Test 5] Depth First Search (DFS) Traversal...\n";
    auto dfs = engine.dfsTraversal(BloodGroup::O_NEG);
    assert(dfs.size() == 8);
    std::cout << " -> PASSED: DFS traversal executed successfully.\n\n";

    // TEST 6: AVL Tree Insertion and Search
    std::cout << "[Test 6] AVL Tree Indexing & Log(N) Search...\n";
    AVLTree<DonorInfo> avl;
    avl.insert(42, {42, "Dr. Alice", BloodGroup::O_POS, true});
    avl.insert(17, {17, "Bob", BloodGroup::A_NEG, true});
    avl.insert(88, {88, "Charlie", BloodGroup::B_POS, false});

    DonorInfo found;
    assert(avl.search(42, found) && found.name == "Dr. Alice");
    assert(avl.search(17, found) && found.blood_group == BloodGroup::A_NEG);
    assert(!avl.search(999, found));
    std::cout << " -> PASSED: AVL tree insertion, balancing, and search passed.\n\n";

    // TEST 7: BloodHashMap Chaining and Lookup
    std::cout << "[Test 7] Blood Group Hash Map (O(1) Bucket Chaining)...\n";
    BloodHashMap map;
    map.addDonor({1, "Test Donor 1", BloodGroup::A_POS, true});
    map.addDonor({2, "Test Donor 2", BloodGroup::A_POS, false});
    auto list = map.getDonors(BloodGroup::A_POS);
    assert(list.size() == 2);
    assert(map.getDonors(BloodGroup::AB_NEG).empty());
    std::cout << " -> PASSED: Hash map O(1) blood group lookup verified.\n\n";

    std::cout << "========================================\n";
    std::cout << "ALL DSA UNIT TESTS PASSED SUCCESSFULLY! \n";
    std::cout << "========================================\n";
    return 0;
}
