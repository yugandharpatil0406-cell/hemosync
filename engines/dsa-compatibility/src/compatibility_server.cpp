#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>

#pragma comment(lib, "ws2_32.lib")

#include "compatibility.h"

#include <string>
#include <sstream>
#include <iostream>
#include <vector>
#include <algorithm>
#include <cstring>
#include <cctype>

// ─────────────────────────────────────────────────────────────────────────────
// Tiny JSON helpers
// ─────────────────────────────────────────────────────────────────────────────
static std::string escapeJson(const std::string& s) {
    std::string out;
    for (char c : s) {
        switch (c) {
            case '"':  out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n";  break;
            case '\r': out += "\\r";  break;
            case '\t': out += "\\t";  break;
            default:   out += c;
        }
    }
    return out;
}

static std::string trim(const std::string& s) {
    size_t a = s.find_first_not_of(" \t\r\n");
    if (a == std::string::npos) return "";
    size_t b = s.find_last_not_of(" \t\r\n");
    return s.substr(a, b - a + 1);
}

static std::string jsonGetString(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    auto pos = json.find(search);
    if (pos == std::string::npos) return "";
    pos = json.find(':', pos + search.size());
    if (pos == std::string::npos) return "";
    pos++;
    while (pos < json.size() && (json[pos] == ' ' || json[pos] == '\t')) pos++;
    if (pos < json.size() && json[pos] == '"') {
        pos++;
        std::string val;
        while (pos < json.size() && json[pos] != '"') {
            if (json[pos] == '\\' && pos + 1 < json.size()) {
                val += json[pos + 1];
                pos += 2;
            } else {
                val += json[pos++];
            }
        }
        return val;
    }
    std::string val;
    while (pos < json.size() && json[pos] != ',' && json[pos] != '}' && json[pos] != ' ' && json[pos] != '\r' && json[pos] != '\n') {
        val += json[pos++];
    }
    return trim(val);
}

static int jsonGetInt(const std::string& json, const std::string& key, int def = 0) {
    std::string v = jsonGetString(json, key);
    if (v.empty()) return def;
    try { return std::stoi(v); } catch (...) { return def; }
}

static bool jsonGetBool(const std::string& json, const std::string& key, bool def = true) {
    std::string v = jsonGetString(json, key);
    if (v == "true" || v == "1") return true;
    if (v == "false" || v == "0") return false;
    return def;
}

static std::string donorToJson(const DonorInfo& d) {
    std::ostringstream o;
    o << "{\"id\":" << d.id
      << ",\"name\":\"" << escapeJson(d.name) << "\""
      << ",\"blood_group\":\"" << bloodGroupToString(d.blood_group) << "\""
      << ",\"is_available\":" << (d.is_available ? "true" : "false")
      << "}";
    return o.str();
}

static std::string donorsToJson(const std::vector<DonorInfo>& donors) {
    std::ostringstream o;
    o << "[";
    for (size_t i = 0; i < donors.size(); i++) {
        if (i > 0) o << ",";
        o << donorToJson(donors[i]);
    }
    o << "]";
    return o.str();
}

static std::string bloodGroupsToJson(const std::vector<BloodGroup>& groups) {
    std::ostringstream o;
    o << "[";
    for (size_t i = 0; i < groups.size(); i++) {
        if (i > 0) o << ",";
        o << "\"" << bloodGroupToString(groups[i]) << "\"";
    }
    o << "]";
    return o.str();
}

static std::string makeResponse(int status, const std::string& body) {
    std::string statusText = "OK";
    if (status == 400) statusText = "Bad Request";
    else if (status == 404) statusText = "Not Found";
    else if (status == 405) statusText = "Method Not Allowed";
    else if (status == 500) statusText = "Internal Server Error";

    std::ostringstream o;
    o << "HTTP/1.1 " << status << " " << statusText << "\r\n"
      << "Content-Type: application/json; charset=utf-8\r\n"
      << "Access-Control-Allow-Origin: *\r\n"
      << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
      << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
      << "Content-Length: " << body.size() << "\r\n"
      << "Connection: close\r\n\r\n"
      << body;
    return o.str();
}

static std::string getQueryParam(const std::string& url, const std::string& param) {
    std::string search = param + "=";
    auto qpos = url.find('?');
    if (qpos == std::string::npos) return "";
    auto pos = url.find(search, qpos);
    if (pos == std::string::npos) return "";
    pos += search.size();
    auto end = url.find('&', pos);
    std::string raw = (end == std::string::npos) ? url.substr(pos) : url.substr(pos, end - pos);
    // decode url (%2B -> +)
    std::string dec;
    for (size_t i = 0; i < raw.size(); i++) {
        if (raw[i] == '%' && i + 2 < raw.size()) {
            std::string hex = raw.substr(i + 1, 2);
            if (hex == "2B" || hex == "2b") dec += '+';
            else if (hex == "20") dec += ' ';
            else dec += raw[i];
            i += 2;
        } else if (raw[i] == '+') {
            dec += ' ';
        } else {
            dec += raw[i];
        }
    }
    return dec;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compatibility Server
// ─────────────────────────────────────────────────────────────────────────────
void runCompatibilityServer(int port) {
    CompatibilityEngine engine;

    // Seed some initial demo donors into AVL tree & Hash map
    engine.addDonor({1, "John Smith", BloodGroup::O_POS, true});
    engine.addDonor({2, "Emily Johnson", BloodGroup::A_POS, true});
    engine.addDonor({3, "Michael Williams", BloodGroup::B_POS, true});
    engine.addDonor({4, "Jessica Brown", BloodGroup::O_NEG, true});
    engine.addDonor({5, "David Jones", BloodGroup::A_POS, true});
    engine.addDonor({6, "Ashley Garcia", BloodGroup::AB_POS, true});
    engine.addDonor({7, "Chris Martinez", BloodGroup::O_POS, true});
    engine.addDonor({8, "Amanda Anderson", BloodGroup::A_NEG, true});
    engine.addDonor({9, "Daniel Taylor", BloodGroup::B_NEG, true});
    engine.addDonor({10, "Megan Thomas", BloodGroup::AB_NEG, true});

    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) {
        std::cerr << "[DSA Engine] WSAStartup failed.\n";
        return;
    }

    SOCKET server_sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (server_sock == INVALID_SOCKET) {
        std::cerr << "[DSA Engine] Socket creation failed.\n";
        WSACleanup();
        return;
    }

    int opt = 1;
    setsockopt(server_sock, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

    sockaddr_in server_addr{};
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(static_cast<u_short>(port));

    if (bind(server_sock, (sockaddr*)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {
        std::cerr << "[DSA Engine] Bind failed on port " << port << ".\n";
        closesocket(server_sock);
        WSACleanup();
        return;
    }

    if (listen(server_sock, 16) == SOCKET_ERROR) {
        std::cerr << "[DSA Engine] Listen failed.\n";
        closesocket(server_sock);
        WSACleanup();
        return;
    }

    std::cout << "[DSA Compatibility Engine] Listening on http://localhost:" << port << "\n";

    while (true) {
        sockaddr_in client_addr{};
        int client_len = sizeof(client_addr);
        SOCKET client_sock = accept(server_sock, (sockaddr*)&client_addr, &client_len);
        if (client_sock == INVALID_SOCKET) continue;

        char buffer[8192];
        int bytes = recv(client_sock, buffer, sizeof(buffer) - 1, 0);
        if (bytes <= 0) {
            closesocket(client_sock);
            continue;
        }
        buffer[bytes] = '\0';
        std::string raw(buffer, bytes);

        std::string method, path;
        {
            std::istringstream ss(raw);
            ss >> method >> path;
        }

        if (method == "OPTIONS") {
            std::string res = makeResponse(200, "{}");
            send(client_sock, res.c_str(), (int)res.size(), 0);
            closesocket(client_sock);
            continue;
        }

        std::string body;
        auto bodyPos = raw.find("\r\n\r\n");
        if (bodyPos != std::string::npos) {
            body = raw.substr(bodyPos + 4);
        }

        std::string resBody;
        int status = 200;

        std::string basePath = path;
        auto qmark = basePath.find('?');
        if (qmark != std::string::npos) basePath = basePath.substr(0, qmark);

        // 1. Health check
        if (basePath == "/api/compatibility/health" && method == "GET") {
            resBody = "{\"status\":\"ok\",\"engine\":\"DSA Compatibility Matcher (C++17)\"}";
        }
        // 2. Compatibility check
        else if (basePath == "/api/compatibility/check" && method == "POST") {
            std::string donor_bg_str = jsonGetString(body, "donor_blood_group");
            std::string recipient_bg_str = jsonGetString(body, "recipient_blood_group");

            if (donor_bg_str.empty() || recipient_bg_str.empty()) {
                status = 400;
                resBody = "{\"success\":false,\"message\":\"donor_blood_group and recipient_blood_group are required\"}";
            } else {
                BloodGroup donor_bg = bloodGroupFromString(donor_bg_str);
                BloodGroup recipient_bg = bloodGroupFromString(recipient_bg_str);
                bool compatible = engine.checkCompatibility(donor_bg, recipient_bg);

                std::vector<BloodGroup> compatible_donors = engine.findCompatibleRecipients(donor_bg); // all groups donor can donate to
                auto donorsForRecipient = engine.findCompatibleDonors(recipient_bg, false);

                std::ostringstream o;
                o << "{\"success\":true"
                  << ",\"donor_blood_group\":\"" << donor_bg_str << "\""
                  << ",\"recipient_blood_group\":\"" << recipient_bg_str << "\""
                  << ",\"compatible\":" << (compatible ? "true" : "false")
                  << ",\"rule\":\"Red Blood Cell (RBC) ABO & Rh Compatibility\""
                  << ",\"can_receive_from\":" << bloodGroupsToJson(engine.findCompatibleRecipients(donor_bg))
                  << "}";
                resBody = o.str();
            }
        }
        // 3. Find compatible donors for recipient
        else if (basePath == "/api/compatibility/donors" && method == "GET") {
            std::string bg_str = getQueryParam(path, "blood_group");
            if (bg_str.empty()) bg_str = "O+";
            // Check if available_only
            std::string avail_str = getQueryParam(path, "available_only");
            bool avail_only = (avail_str != "false" && avail_str != "0");

            BloodGroup bg = bloodGroupFromString(bg_str);
            auto donors = engine.findCompatibleDonors(bg, avail_only);

            // Also get list of compatible blood groups
            // In red cell, donor can donate to recipient
            std::vector<BloodGroup> compatibleGroups;
            for (int i = 0; i < 8; i++) {
                BloodGroup cand = static_cast<BloodGroup>(i);
                if (engine.checkCompatibility(cand, bg)) {
                    compatibleGroups.push_back(cand);
                }
            }

            std::ostringstream o;
            o << "{\"success\":true"
              << ",\"recipient_blood_group\":\"" << bg_str << "\""
              << ",\"compatible_blood_groups\":" << bloodGroupsToJson(compatibleGroups)
              << ",\"available_donors\":" << donorsToJson(donors)
              << ",\"total_donors\":" << donors.size()
              << "}";
            resBody = o.str();
        }
        // 4. Find compatible recipients for a donor
        else if (basePath == "/api/compatibility/recipients" && method == "GET") {
            std::string bg_str = getQueryParam(path, "blood_group");
            if (bg_str.empty()) bg_str = "O-";
            BloodGroup bg = bloodGroupFromString(bg_str);
            auto recipients = engine.findCompatibleRecipients(bg);

            std::ostringstream o;
            o << "{\"success\":true"
              << ",\"donor_blood_group\":\"" << bg_str << "\""
              << ",\"compatible_recipients\":" << bloodGroupsToJson(recipients)
              << "}";
            resBody = o.str();
        }
        // 5. Add donor to AVL tree & Hash map
        else if (basePath == "/api/compatibility/donor" && method == "POST") {
            int id = jsonGetInt(body, "id", 0);
            std::string name = jsonGetString(body, "name");
            std::string bg_str = jsonGetString(body, "blood_group");
            bool avail = jsonGetBool(body, "is_available", true);

            if (id <= 0 || name.empty() || bg_str.empty()) {
                status = 400;
                resBody = "{\"success\":false,\"message\":\"id, name, and blood_group are required\"}";
            } else {
                DonorInfo d{id, name, bloodGroupFromString(bg_str), avail};
                engine.addDonor(d);
                resBody = "{\"success\":true,\"message\":\"Donor indexed in AVL tree and BloodHashMap successfully\",\"donor\":" + donorToJson(d) + "}";
            }
        }
        // 6. Search donor in AVL tree by ID
        else if (basePath == "/api/compatibility/donor" && method == "GET") {
            int id = std::stoi(getQueryParam(path, "id").empty() ? "0" : getQueryParam(path, "id"));
            DonorInfo found;
            if (engine.searchDonor(id, found)) {
                resBody = "{\"success\":true,\"found\":true,\"indexed_by\":\"AVL Tree\",\"donor\":" + donorToJson(found) + "}";
            } else {
                status = 404;
                resBody = "{\"success\":false,\"found\":false,\"message\":\"Donor not found in AVL tree\"}";
            }
        }
        // 7. BFS traversal of recipient compatibility graph
        else if (basePath == "/api/compatibility/bfs" && method == "GET") {
            std::string start_str = getQueryParam(path, "start");
            if (start_str.empty()) start_str = "O-";
            BloodGroup start = bloodGroupFromString(start_str);
            auto order = engine.bfsTraversal(start);

            std::ostringstream o;
            o << "{\"success\":true"
              << ",\"algorithm\":\"Breadth First Search (BFS)\""
              << ",\"start_node\":\"" << start_str << "\""
              << ",\"traversal_order\":" << bloodGroupsToJson(order)
              << "}";
            resBody = o.str();
        }
        // 8. DFS traversal
        else if (basePath == "/api/compatibility/dfs" && method == "GET") {
            std::string start_str = getQueryParam(path, "start");
            if (start_str.empty()) start_str = "O-";
            BloodGroup start = bloodGroupFromString(start_str);
            auto order = engine.dfsTraversal(start);

            std::ostringstream o;
            o << "{\"success\":true"
              << ",\"algorithm\":\"Depth First Search (DFS)\""
              << ",\"start_node\":\"" << start_str << "\""
              << ",\"traversal_order\":" << bloodGroupsToJson(order)
              << "}";
            resBody = o.str();
        }
        // 9. Full compatibility graph
        else if (basePath == "/api/compatibility/graph" && method == "GET") {
            std::ostringstream o;
            o << "{\"success\":true"
              << ",\"nodes\":[\"A+\",\"A-\",\"B+\",\"B-\",\"AB+\",\"AB-\",\"O+\",\"O-\"]"
              << ",\"edges\":[";

            bool first = true;
            for (int i = 0; i < 8; i++) {
                BloodGroup from = static_cast<BloodGroup>(i);
                auto to_list = engine.findCompatibleRecipients(from);
                for (auto to : to_list) {
                    if (!first) o << ",";
                    first = false;
                    o << "{\"from\":\"" << bloodGroupToString(from) << "\",\"to\":\"" << bloodGroupToString(to) << "\"}";
                }
            }
            o << "]}";
            resBody = o.str();
        } else {
            status = 404;
            resBody = "{\"success\":false,\"message\":\"Endpoint not found\"}";
        }

        std::string httpResponse = makeResponse(status, resBody);
        send(client_sock, httpResponse.c_str(), (int)httpResponse.size(), 0);
        closesocket(client_sock);
    }

    closesocket(server_sock);
    WSACleanup();
}
