#ifndef COMPATIBILITY_H
#define COMPATIBILITY_H

#include <string>
#include <vector>
#include <unordered_map>
#include <functional>
#include <memory>

// ─────────────────────────────────────────────────────────────────────────────
// Blood group enumeration (8 ABO/Rh types)
// ─────────────────────────────────────────────────────────────────────────────
enum class BloodGroup {
    A_POS,    // A+
    A_NEG,    // A-
    B_POS,    // B+
    B_NEG,    // B-
    AB_POS,   // AB+
    AB_NEG,   // AB-
    O_POS,    // O+
    O_NEG     // O-
};

std::string bloodGroupToString(BloodGroup bg);
BloodGroup  bloodGroupFromString(const std::string& s);

// ─────────────────────────────────────────────────────────────────────────────
// Donor info
// ─────────────────────────────────────────────────────────────────────────────
struct DonorInfo {
    int id;
    std::string name;
    BloodGroup blood_group;
    bool is_available;
};

// ─────────────────────────────────────────────────────────────────────────────
// Directed graph — blood compatibility (8 nodes)
// Edge from A→B means blood group A can donate to blood group B
// ─────────────────────────────────────────────────────────────────────────────
class BloodCompatibilityGraph {
public:
    BloodCompatibilityGraph();

    void addEdge(BloodGroup from, BloodGroup to);
    bool canDonate(BloodGroup donor_bg, BloodGroup recipient_bg) const;

    // Returns list of blood groups that can donate TO recipient_bg
    std::vector<BloodGroup> getCompatibleDonors(BloodGroup recipient_bg) const;

    // Returns list of blood groups that donor_bg CAN donate TO
    std::vector<BloodGroup> getCompatibleRecipients(BloodGroup donor_bg) const;

    // Traversals
    std::vector<BloodGroup> bfsTraversal(BloodGroup start) const;
    std::vector<BloodGroup> dfsTraversal(BloodGroup start) const;

    // Get full adjacency list for JSON export
    const std::unordered_map<int, std::vector<int>>& getAdjList() const;

private:
    // adjacency list:  node index → list of neighbor indices
    std::unordered_map<int, std::vector<int>> adj_;

    static int bgIndex(BloodGroup bg);
    static BloodGroup indexBg(int i);

    void dfsHelper(int node, std::vector<bool>& visited, std::vector<BloodGroup>& result) const;
};

// ─────────────────────────────────────────────────────────────────────────────
// AVL Tree (templated, keyed by int)
// ─────────────────────────────────────────────────────────────────────────────
template <typename T>
class AVLTree {
public:
    AVLTree() : root_(nullptr) {}
    ~AVLTree() { destroy(root_); }

    void insert(int key, const T& value);
    bool search(int key, T& out) const;
    bool remove(int key);
    std::vector<std::pair<int, T>> inorder() const;

private:
    struct Node {
        int key;
        T value;
        int height;
        Node* left;
        Node* right;
        Node(int k, const T& v) : key(k), value(v), height(1), left(nullptr), right(nullptr) {}
    };

    Node* root_;

    int height(Node* n) const { return n ? n->height : 0; }
    int balanceFactor(Node* n) const { return n ? height(n->left) - height(n->right) : 0; }
    void updateHeight(Node* n) {
        if (n) n->height = 1 + std::max(height(n->left), height(n->right));
    }

    // Rotations
    Node* rotateRight(Node* y);   // LL
    Node* rotateLeft(Node* x);    // RR

    Node* balance(Node* n);
    Node* insertNode(Node* n, int key, const T& value);
    Node* removeNode(Node* n, int key, bool& removed);
    Node* minValueNode(Node* n) const;

    bool searchNode(Node* n, int key, T& out) const;
    void inorderTraversal(Node* n, std::vector<std::pair<int, T>>& result) const;
    void destroy(Node* n);
};

// ─── AVL Implementation (header-only for templates) ─────────────────────────

template <typename T>
typename AVLTree<T>::Node* AVLTree<T>::rotateRight(Node* y) {
    Node* x = y->left;
    Node* t2 = x->right;
    x->right = y;
    y->left = t2;
    updateHeight(y);
    updateHeight(x);
    return x;
}

template <typename T>
typename AVLTree<T>::Node* AVLTree<T>::rotateLeft(Node* x) {
    Node* y = x->right;
    Node* t2 = y->left;
    y->left = x;
    x->right = t2;
    updateHeight(x);
    updateHeight(y);
    return y;
}

template <typename T>
typename AVLTree<T>::Node* AVLTree<T>::balance(Node* n) {
    if (!n) return n;
    updateHeight(n);
    int bf = balanceFactor(n);

    // LL case
    if (bf > 1 && balanceFactor(n->left) >= 0) {
        return rotateRight(n);
    }
    // LR case
    if (bf > 1 && balanceFactor(n->left) < 0) {
        n->left = rotateLeft(n->left);
        return rotateRight(n);
    }
    // RR case
    if (bf < -1 && balanceFactor(n->right) <= 0) {
        return rotateLeft(n);
    }
    // RL case
    if (bf < -1 && balanceFactor(n->right) > 0) {
        n->right = rotateRight(n->right);
        return rotateLeft(n);
    }
    return n;
}

template <typename T>
typename AVLTree<T>::Node* AVLTree<T>::insertNode(Node* n, int key, const T& value) {
    if (!n) return new Node(key, value);
    if (key < n->key)       n->left  = insertNode(n->left, key, value);
    else if (key > n->key)  n->right = insertNode(n->right, key, value);
    else { n->value = value; return n; } // update existing
    return balance(n);
}

template <typename T>
void AVLTree<T>::insert(int key, const T& value) {
    root_ = insertNode(root_, key, value);
}

template <typename T>
typename AVLTree<T>::Node* AVLTree<T>::minValueNode(Node* n) const {
    Node* cur = n;
    while (cur && cur->left) cur = cur->left;
    return cur;
}

template <typename T>
typename AVLTree<T>::Node* AVLTree<T>::removeNode(Node* n, int key, bool& removed) {
    if (!n) return n;

    if (key < n->key)       n->left  = removeNode(n->left, key, removed);
    else if (key > n->key)  n->right = removeNode(n->right, key, removed);
    else {
        removed = true;
        if (!n->left || !n->right) {
            Node* temp = n->left ? n->left : n->right;
            if (!temp) {
                delete n;
                return nullptr;
            } else {
                Node* toDelete = n;
                n = temp;
                delete toDelete;
            }
        } else {
            Node* succ = minValueNode(n->right);
            n->key = succ->key;
            n->value = succ->value;
            n->right = removeNode(n->right, succ->key, removed);
        }
    }
    return balance(n);
}

template <typename T>
bool AVLTree<T>::remove(int key) {
    bool removed = false;
    root_ = removeNode(root_, key, removed);
    return removed;
}

template <typename T>
bool AVLTree<T>::searchNode(Node* n, int key, T& out) const {
    if (!n) return false;
    if (key == n->key) { out = n->value; return true; }
    if (key < n->key)  return searchNode(n->left, key, out);
    return searchNode(n->right, key, out);
}

template <typename T>
bool AVLTree<T>::search(int key, T& out) const {
    return searchNode(root_, key, out);
}

template <typename T>
void AVLTree<T>::inorderTraversal(Node* n, std::vector<std::pair<int, T>>& result) const {
    if (!n) return;
    inorderTraversal(n->left, result);
    result.emplace_back(n->key, n->value);
    inorderTraversal(n->right, result);
}

template <typename T>
std::vector<std::pair<int, T>> AVLTree<T>::inorder() const {
    std::vector<std::pair<int, T>> result;
    inorderTraversal(root_, result);
    return result;
}

template <typename T>
void AVLTree<T>::destroy(Node* n) {
    if (!n) return;
    destroy(n->left);
    destroy(n->right);
    delete n;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hash Map:  blood group string → vector<DonorInfo>
// ─────────────────────────────────────────────────────────────────────────────
class BloodHashMap {
public:
    BloodHashMap(size_t bucket_count = 16);

    void addDonor(const DonorInfo& donor);
    std::vector<DonorInfo> getDonors(BloodGroup bg) const;
    std::vector<DonorInfo> getAllDonors() const;

private:
    struct Entry {
        std::string key;
        std::vector<DonorInfo> donors;
        Entry* next;
        Entry(const std::string& k) : key(k), next(nullptr) {}
    };

    size_t bucket_count_;
    std::vector<Entry*> buckets_;

    size_t hash(const std::string& key) const;
    Entry* findOrCreate(const std::string& key);
    Entry* find(const std::string& key) const;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main compatibility engine
// ─────────────────────────────────────────────────────────────────────────────
class CompatibilityEngine {
public:
    CompatibilityEngine();

    bool checkCompatibility(BloodGroup donor_bg, BloodGroup recipient_bg) const;
    std::vector<DonorInfo> findCompatibleDonors(BloodGroup recipient_bg, bool available_only) const;
    std::vector<BloodGroup> findCompatibleRecipients(BloodGroup donor_bg) const;

    void addDonor(const DonorInfo& donor);
    bool searchDonor(int id, DonorInfo& out) const;

    std::vector<BloodGroup> bfsTraversal(BloodGroup start) const;
    std::vector<BloodGroup> dfsTraversal(BloodGroup start) const;

    const BloodCompatibilityGraph& getGraph() const { return graph_; }

private:
    BloodCompatibilityGraph graph_;
    AVLTree<DonorInfo> donor_tree_;          // keyed by donor id
    BloodHashMap donor_map_;                 // blood group → donors

    void initializeGraph();
};

#endif // COMPATIBILITY_H
