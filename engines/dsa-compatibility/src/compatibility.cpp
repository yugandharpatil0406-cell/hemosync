#include "compatibility.h"
#include <queue>
#include <algorithm>
#include <cstring>

// ─────────────────────────────────────────────────────────────────────────────
// Blood group string conversions
// ─────────────────────────────────────────────────────────────────────────────
std::string bloodGroupToString(BloodGroup bg) {
    switch (bg) {
        case BloodGroup::A_POS:   return "A+";
        case BloodGroup::A_NEG:   return "A-";
        case BloodGroup::B_POS:   return "B+";
        case BloodGroup::B_NEG:   return "B-";
        case BloodGroup::AB_POS:  return "AB+";
        case BloodGroup::AB_NEG:  return "AB-";
        case BloodGroup::O_POS:   return "O+";
        case BloodGroup::O_NEG:   return "O-";
    }
    return "Unknown";
}

BloodGroup bloodGroupFromString(const std::string& s) {
    if (s == "A+"  || s == "A_POS")  return BloodGroup::A_POS;
    if (s == "A-"  || s == "A_NEG")  return BloodGroup::A_NEG;
    if (s == "B+"  || s == "B_POS")  return BloodGroup::B_POS;
    if (s == "B-"  || s == "B_NEG")  return BloodGroup::B_NEG;
    if (s == "AB+" || s == "AB_POS") return BloodGroup::AB_POS;
    if (s == "AB-" || s == "AB_NEG") return BloodGroup::AB_NEG;
    if (s == "O+"  || s == "O_POS")  return BloodGroup::O_POS;
    if (s == "O-"  || s == "O_NEG")  return BloodGroup::O_NEG;
    return BloodGroup::O_POS; // fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// BloodCompatibilityGraph
// ─────────────────────────────────────────────────────────────────────────────
int BloodCompatibilityGraph::bgIndex(BloodGroup bg) {
    return static_cast<int>(bg);
}

BloodGroup BloodCompatibilityGraph::indexBg(int i) {
    return static_cast<BloodGroup>(i);
}

BloodCompatibilityGraph::BloodCompatibilityGraph() {
    // Initialize adjacency list for all 8 nodes
    for (int i = 0; i < 8; i++) {
        adj_[i] = {};
    }
}

void BloodCompatibilityGraph::addEdge(BloodGroup from, BloodGroup to) {
    int f = bgIndex(from);
    int t = bgIndex(to);
    // Avoid duplicates
    auto& neighbors = adj_[f];
    if (std::find(neighbors.begin(), neighbors.end(), t) == neighbors.end()) {
        neighbors.push_back(t);
    }
}

bool BloodCompatibilityGraph::canDonate(BloodGroup donor_bg, BloodGroup recipient_bg) const {
    int f = bgIndex(donor_bg);
    int t = bgIndex(recipient_bg);
    auto it = adj_.find(f);
    if (it == adj_.end()) return false;
    return std::find(it->second.begin(), it->second.end(), t) != it->second.end();
}

std::vector<BloodGroup> BloodCompatibilityGraph::getCompatibleDonors(BloodGroup recipient_bg) const {
    // Find all blood groups that have an edge TO recipient_bg
    int target = bgIndex(recipient_bg);
    std::vector<BloodGroup> donors;
    for (int i = 0; i < 8; i++) {
        auto it = adj_.find(i);
        if (it != adj_.end()) {
            if (std::find(it->second.begin(), it->second.end(), target) != it->second.end()) {
                donors.push_back(indexBg(i));
            }
        }
    }
    return donors;
}

std::vector<BloodGroup> BloodCompatibilityGraph::getCompatibleRecipients(BloodGroup donor_bg) const {
    int f = bgIndex(donor_bg);
    std::vector<BloodGroup> recipients;
    auto it = adj_.find(f);
    if (it != adj_.end()) {
        for (int t : it->second) {
            recipients.push_back(indexBg(t));
        }
    }
    return recipients;
}

std::vector<BloodGroup> BloodCompatibilityGraph::bfsTraversal(BloodGroup start) const {
    std::vector<BloodGroup> result;
    std::vector<bool> visited(8, false);
    std::queue<int> q;

    int s = bgIndex(start);
    visited[s] = true;
    q.push(s);

    while (!q.empty()) {
        int cur = q.front();
        q.pop();
        result.push_back(indexBg(cur));

        auto it = adj_.find(cur);
        if (it != adj_.end()) {
            for (int neighbor : it->second) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    q.push(neighbor);
                }
            }
        }
    }
    return result;
}

void BloodCompatibilityGraph::dfsHelper(int node, std::vector<bool>& visited,
                                         std::vector<BloodGroup>& result) const {
    visited[node] = true;
    result.push_back(indexBg(node));

    auto it = adj_.find(node);
    if (it != adj_.end()) {
        for (int neighbor : it->second) {
            if (!visited[neighbor]) {
                dfsHelper(neighbor, visited, result);
            }
        }
    }
}

std::vector<BloodGroup> BloodCompatibilityGraph::dfsTraversal(BloodGroup start) const {
    std::vector<BloodGroup> result;
    std::vector<bool> visited(8, false);
    dfsHelper(bgIndex(start), visited, result);
    return result;
}

const std::unordered_map<int, std::vector<int>>& BloodCompatibilityGraph::getAdjList() const {
    return adj_;
}

// ─────────────────────────────────────────────────────────────────────────────
// BloodHashMap
// ─────────────────────────────────────────────────────────────────────────────
BloodHashMap::BloodHashMap(size_t bucket_count)
    : bucket_count_(bucket_count), buckets_(bucket_count, nullptr)
{}

size_t BloodHashMap::hash(const std::string& key) const {
    size_t h = 0;
    for (char c : key) {
        h = h * 31 + static_cast<size_t>(c);
    }
    return h % bucket_count_;
}

BloodHashMap::Entry* BloodHashMap::findOrCreate(const std::string& key) {
    size_t idx = hash(key);
    Entry* cur = buckets_[idx];
    while (cur) {
        if (cur->key == key) return cur;
        cur = cur->next;
    }
    // Create new entry (chaining)
    Entry* newEntry = new Entry(key);
    newEntry->next = buckets_[idx];
    buckets_[idx] = newEntry;
    return newEntry;
}

BloodHashMap::Entry* BloodHashMap::find(const std::string& key) const {
    size_t idx = hash(key);
    Entry* cur = buckets_[idx];
    while (cur) {
        if (cur->key == key) return cur;
        cur = cur->next;
    }
    return nullptr;
}

void BloodHashMap::addDonor(const DonorInfo& donor) {
    std::string key = bloodGroupToString(donor.blood_group);
    Entry* entry = findOrCreate(key);
    entry->donors.push_back(donor);
}

std::vector<DonorInfo> BloodHashMap::getDonors(BloodGroup bg) const {
    std::string key = bloodGroupToString(bg);
    Entry* entry = find(key);
    if (entry) return entry->donors;
    return {};
}

std::vector<DonorInfo> BloodHashMap::getAllDonors() const {
    std::vector<DonorInfo> all;
    for (size_t i = 0; i < bucket_count_; i++) {
        Entry* cur = buckets_[i];
        while (cur) {
            for (auto& d : cur->donors) {
                all.push_back(d);
            }
            cur = cur->next;
        }
    }
    return all;
}

// ─────────────────────────────────────────────────────────────────────────────
// CompatibilityEngine
// ─────────────────────────────────────────────────────────────────────────────
CompatibilityEngine::CompatibilityEngine() {
    initializeGraph();
}

void CompatibilityEngine::initializeGraph() {
    // RED BLOOD CELL compatibility (directed edges: donor → recipient)

    // O- can donate to everyone (universal donor)
    graph_.addEdge(BloodGroup::O_NEG, BloodGroup::A_POS);
    graph_.addEdge(BloodGroup::O_NEG, BloodGroup::A_NEG);
    graph_.addEdge(BloodGroup::O_NEG, BloodGroup::B_POS);
    graph_.addEdge(BloodGroup::O_NEG, BloodGroup::B_NEG);
    graph_.addEdge(BloodGroup::O_NEG, BloodGroup::AB_POS);
    graph_.addEdge(BloodGroup::O_NEG, BloodGroup::AB_NEG);
    graph_.addEdge(BloodGroup::O_NEG, BloodGroup::O_POS);
    graph_.addEdge(BloodGroup::O_NEG, BloodGroup::O_NEG);

    // O+ can donate to A+, B+, AB+, O+
    graph_.addEdge(BloodGroup::O_POS, BloodGroup::A_POS);
    graph_.addEdge(BloodGroup::O_POS, BloodGroup::B_POS);
    graph_.addEdge(BloodGroup::O_POS, BloodGroup::AB_POS);
    graph_.addEdge(BloodGroup::O_POS, BloodGroup::O_POS);

    // A- can donate to A+, A-, AB+, AB-
    graph_.addEdge(BloodGroup::A_NEG, BloodGroup::A_POS);
    graph_.addEdge(BloodGroup::A_NEG, BloodGroup::A_NEG);
    graph_.addEdge(BloodGroup::A_NEG, BloodGroup::AB_POS);
    graph_.addEdge(BloodGroup::A_NEG, BloodGroup::AB_NEG);

    // A+ can donate to A+, AB+
    graph_.addEdge(BloodGroup::A_POS, BloodGroup::A_POS);
    graph_.addEdge(BloodGroup::A_POS, BloodGroup::AB_POS);

    // B- can donate to B+, B-, AB+, AB-
    graph_.addEdge(BloodGroup::B_NEG, BloodGroup::B_POS);
    graph_.addEdge(BloodGroup::B_NEG, BloodGroup::B_NEG);
    graph_.addEdge(BloodGroup::B_NEG, BloodGroup::AB_POS);
    graph_.addEdge(BloodGroup::B_NEG, BloodGroup::AB_NEG);

    // B+ can donate to B+, AB+
    graph_.addEdge(BloodGroup::B_POS, BloodGroup::B_POS);
    graph_.addEdge(BloodGroup::B_POS, BloodGroup::AB_POS);

    // AB- can donate to AB+, AB-
    graph_.addEdge(BloodGroup::AB_NEG, BloodGroup::AB_POS);
    graph_.addEdge(BloodGroup::AB_NEG, BloodGroup::AB_NEG);

    // AB+ can donate to AB+ only
    graph_.addEdge(BloodGroup::AB_POS, BloodGroup::AB_POS);
}

bool CompatibilityEngine::checkCompatibility(BloodGroup donor_bg, BloodGroup recipient_bg) const {
    return graph_.canDonate(donor_bg, recipient_bg);
}

std::vector<DonorInfo> CompatibilityEngine::findCompatibleDonors(BloodGroup recipient_bg,
                                                                  bool available_only) const {
    auto compatible_bgs = graph_.getCompatibleDonors(recipient_bg);
    std::vector<DonorInfo> result;

    for (auto bg : compatible_bgs) {
        auto donors = donor_map_.getDonors(bg);
        for (auto& d : donors) {
            if (!available_only || d.is_available) {
                result.push_back(d);
            }
        }
    }
    return result;
}

std::vector<BloodGroup> CompatibilityEngine::findCompatibleRecipients(BloodGroup donor_bg) const {
    return graph_.getCompatibleRecipients(donor_bg);
}

void CompatibilityEngine::addDonor(const DonorInfo& donor) {
    donor_tree_.insert(donor.id, donor);
    donor_map_.addDonor(donor);
}

bool CompatibilityEngine::searchDonor(int id, DonorInfo& out) const {
    return donor_tree_.search(id, out);
}

std::vector<BloodGroup> CompatibilityEngine::bfsTraversal(BloodGroup start) const {
    return graph_.bfsTraversal(start);
}

std::vector<BloodGroup> CompatibilityEngine::dfsTraversal(BloodGroup start) const {
    return graph_.dfsTraversal(start);
}
