#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>

#pragma comment(lib, "ws2_32.lib")

#include "scheduler.h"

#include <string>
#include <sstream>
#include <iostream>
#include <vector>
#include <algorithm>
#include <cstring>
#include <cctype>

// ─────────────────────────────────────────────────────────────────────────────
// Tiny JSON helpers (no external library)
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
    // number or other
    std::string val;
    while (pos < json.size() && json[pos] != ',' && json[pos] != '}' && json[pos] != ' ') {
        val += json[pos++];
    }
    return trim(val);
}

static int jsonGetInt(const std::string& json, const std::string& key, int def = 0) {
    std::string v = jsonGetString(json, key);
    if (v.empty()) return def;
    try { return std::stoi(v); } catch (...) { return def; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build JSON for a DonorRequest
// ─────────────────────────────────────────────────────────────────────────────
static std::string requestToJson(const DonorRequest& r) {
    std::ostringstream o;
    o << "{\"id\":" << r.id
      << ",\"donor_id\":" << r.donor_id
      << ",\"slot_id\":" << r.slot_id
      << ",\"priority\":" << r.priority
      << ",\"state\":\"" << DonorScheduler::getStateString(r.state) << "\""
      << ",\"arrival_time\":" << static_cast<long long>(r.arrival_time)
      << ",\"completion_time\":" << static_cast<long long>(r.completion_time)
      << ",\"waiting_time\":" << r.waiting_time
      << "}";
    return o.str();
}

static std::string queueToJson(const std::vector<DonorRequest>& q) {
    std::ostringstream o;
    o << "[";
    for (size_t i = 0; i < q.size(); i++) {
        if (i) o << ",";
        o << requestToJson(q[i]);
    }
    o << "]";
    return o.str();
}

static std::string metricsToJson(const SchedulerMetrics& m) {
    std::ostringstream o;
    o << "{\"avg_waiting_time\":" << m.avg_waiting_time
      << ",\"slot_utilization\":" << m.slot_utilization
      << ",\"confirmed_count\":" << m.confirmed_count
      << ",\"rejected_count\":" << m.rejected_count
      << ",\"total_requests\":" << m.total_requests
      << "}";
    return o.str();
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helpers
// ─────────────────────────────────────────────────────────────────────────────
static std::string httpResponse(int code, const std::string& body) {
    std::string status;
    switch (code) {
        case 200: status = "200 OK"; break;
        case 400: status = "400 Bad Request"; break;
        case 404: status = "404 Not Found"; break;
        case 500: status = "500 Internal Server Error"; break;
        default:  status = std::to_string(code); break;
    }
    std::ostringstream r;
    r << "HTTP/1.1 " << status << "\r\n"
      << "Content-Type: application/json\r\n"
      << "Access-Control-Allow-Origin: *\r\n"
      << "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n"
      << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
      << "Connection: close\r\n"
      << "Content-Length: " << body.size() << "\r\n"
      << "\r\n"
      << body;
    return r.str();
}

// ─────────────────────────────────────────────────────────────────────────────
// Read full HTTP request from socket
// ─────────────────────────────────────────────────────────────────────────────
struct HttpRequest {
    std::string method;
    std::string path;
    std::string query;      // everything after '?'
    std::string body;
    int content_length = 0;
};

static HttpRequest parseRequest(SOCKET client) {
    HttpRequest req;
    std::string raw;
    char buf[4096];

    // Read headers
    while (true) {
        int n = recv(client, buf, sizeof(buf) - 1, 0);
        if (n <= 0) break;
        buf[n] = '\0';
        raw += buf;
        if (raw.find("\r\n\r\n") != std::string::npos) break;
    }

    // Parse request line
    auto first_line_end = raw.find("\r\n");
    if (first_line_end == std::string::npos) return req;
    std::string first_line = raw.substr(0, first_line_end);

    // METHOD PATH HTTP/1.1
    auto sp1 = first_line.find(' ');
    if (sp1 == std::string::npos) return req;
    req.method = first_line.substr(0, sp1);

    auto sp2 = first_line.find(' ', sp1 + 1);
    std::string full_path = first_line.substr(sp1 + 1, sp2 - sp1 - 1);

    auto qpos = full_path.find('?');
    if (qpos != std::string::npos) {
        req.path = full_path.substr(0, qpos);
        req.query = full_path.substr(qpos + 1);
    } else {
        req.path = full_path;
    }

    // Parse Content-Length
    std::string lower_raw = raw;
    std::transform(lower_raw.begin(), lower_raw.end(), lower_raw.begin(), ::tolower);
    auto cl_pos = lower_raw.find("content-length:");
    if (cl_pos != std::string::npos) {
        auto cl_start = cl_pos + 15;
        auto cl_end = lower_raw.find("\r\n", cl_start);
        std::string cl_str = trim(raw.substr(cl_start, cl_end - cl_start));
        try { req.content_length = std::stoi(cl_str); } catch (...) {}
    }

    // Extract body
    auto header_end = raw.find("\r\n\r\n");
    if (header_end != std::string::npos) {
        req.body = raw.substr(header_end + 4);
    }

    // Read remaining body if needed
    while (static_cast<int>(req.body.size()) < req.content_length) {
        int remaining = req.content_length - static_cast<int>(req.body.size());
        int to_read = (remaining < 4096) ? remaining : 4095;
        int n = recv(client, buf, to_read, 0);
        if (n <= 0) break;
        buf[n] = '\0';
        req.body += std::string(buf, n);
    }

    return req;
}

// ─────────────────────────────────────────────────────────────────────────────
// Query string helper
// ─────────────────────────────────────────────────────────────────────────────
static std::string queryParam(const std::string& query, const std::string& key) {
    std::string search = key + "=";
    auto pos = query.find(search);
    if (pos == std::string::npos) return "";
    auto start = pos + search.size();
    auto end = query.find('&', start);
    if (end == std::string::npos) return query.substr(start);
    return query.substr(start, end - start);
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────
static std::string handleRoute(DonorScheduler& scheduler, const HttpRequest& req) {
    // OPTIONS for CORS preflight
    if (req.method == "OPTIONS") {
        return httpResponse(200, "{}");
    }

    // GET /api/scheduler/health
    if (req.method == "GET" && req.path == "/api/scheduler/health") {
        return httpResponse(200, "{\"status\":\"ok\",\"engine\":\"os-scheduler\",\"port\":5001}");
    }

    // POST /api/scheduler/request
    if (req.method == "POST" && req.path == "/api/scheduler/request") {
        int donor_id = jsonGetInt(req.body, "donor_id", 0);
        int slot_id  = jsonGetInt(req.body, "slot_id", 1);
        int priority = jsonGetInt(req.body, "priority", 5);

        if (donor_id == 0) {
            return httpResponse(400, "{\"error\":\"donor_id is required\"}");
        }

        auto r = scheduler.addRequest(donor_id, slot_id, priority);
        std::string json = "{\"success\":true,\"request\":" + requestToJson(r) + "}";
        return httpResponse(200, json);
    }

    // POST /api/scheduler/process
    if (req.method == "POST" && req.path == "/api/scheduler/process") {
        auto results = scheduler.processQueue();
        std::string algoStr;
        switch (scheduler.getAlgorithm()) {
            case SchedulerAlgorithm::FCFS:        algoStr = "FCFS"; break;
            case SchedulerAlgorithm::PRIORITY:    algoStr = "Priority"; break;
            case SchedulerAlgorithm::ROUND_ROBIN: algoStr = "RoundRobin"; break;
        }
        std::string json = "{\"success\":true,\"algorithm\":\"" + algoStr
                         + "\",\"processed\":" + std::to_string(results.size())
                         + ",\"queue\":" + queueToJson(results) + "}";
        return httpResponse(200, json);
    }

    // GET /api/scheduler/queue
    if (req.method == "GET" && req.path == "/api/scheduler/queue") {
        auto q = scheduler.getQueue();
        std::string json = "{\"queue\":" + queueToJson(q)
                         + ",\"count\":" + std::to_string(q.size()) + "}";
        return httpResponse(200, json);
    }

    // GET /api/scheduler/metrics
    if (req.method == "GET" && req.path == "/api/scheduler/metrics") {
        auto m = scheduler.getMetrics();
        return httpResponse(200, metricsToJson(m));
    }

    // POST /api/scheduler/algorithm
    if (req.method == "POST" && req.path == "/api/scheduler/algorithm") {
        std::string algo = jsonGetString(req.body, "algorithm");
        int tq = jsonGetInt(req.body, "time_quantum", 0);

        if (algo == "FCFS") {
            scheduler.setAlgorithm(SchedulerAlgorithm::FCFS);
        } else if (algo == "Priority") {
            scheduler.setAlgorithm(SchedulerAlgorithm::PRIORITY);
        } else if (algo == "RoundRobin") {
            scheduler.setAlgorithm(SchedulerAlgorithm::ROUND_ROBIN);
        } else {
            return httpResponse(400, "{\"error\":\"Invalid algorithm. Use FCFS, Priority, or RoundRobin\"}");
        }

        if (tq > 0) scheduler.setTimeQuantum(tq);

        std::string json = "{\"success\":true,\"algorithm\":\"" + algo + "\"";
        if (tq > 0) json += ",\"time_quantum\":" + std::to_string(tq);
        json += "}";
        return httpResponse(200, json);
    }

    // POST /api/scheduler/simulate
    if (req.method == "POST" && req.path == "/api/scheduler/simulate") {
        int n = jsonGetInt(req.body, "num_requests", 5);
        std::string log = scheduler.simulateScheduling(n);
        auto m = scheduler.getMetrics();
        std::string json = "{\"success\":true,\"log\":\"" + escapeJson(log)
                         + "\",\"metrics\":" + metricsToJson(m) + "}";
        return httpResponse(200, json);
    }

    // POST /api/scheduler/transition
    if (req.method == "POST" && req.path == "/api/scheduler/transition") {
        int request_id = jsonGetInt(req.body, "request_id", 0);
        std::string state_str = jsonGetString(req.body, "new_state");

        if (request_id == 0 || state_str.empty()) {
            return httpResponse(400, "{\"error\":\"request_id and new_state are required\"}");
        }

        DonorState new_state = DonorScheduler::stateFromString(state_str);
        bool ok = scheduler.transitionState(request_id, new_state);

        if (ok) {
            return httpResponse(200, "{\"success\":true,\"request_id\":" + std::to_string(request_id)
                              + ",\"new_state\":\"" + state_str + "\"}");
        } else {
            return httpResponse(400, "{\"success\":false,\"error\":\"Invalid state transition\"}");
        }
    }

    return httpResponse(404, "{\"error\":\"Not found\"}");
}

// ─────────────────────────────────────────────────────────────────────────────
// Server entry point
// ─────────────────────────────────────────────────────────────────────────────
int runSchedulerServer(int port) {
    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) {
        std::cerr << "WSAStartup failed: " << WSAGetLastError() << std::endl;
        return 1;
    }

    SOCKET server_fd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (server_fd == INVALID_SOCKET) {
        std::cerr << "Socket creation failed: " << WSAGetLastError() << std::endl;
        WSACleanup();
        return 1;
    }

    // Allow port reuse
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(static_cast<u_short>(port));

    if (bind(server_fd, (sockaddr*)&addr, sizeof(addr)) == SOCKET_ERROR) {
        std::cerr << "Bind failed on port " << port << ": " << WSAGetLastError() << std::endl;
        closesocket(server_fd);
        WSACleanup();
        return 1;
    }

    if (listen(server_fd, SOMAXCONN) == SOCKET_ERROR) {
        std::cerr << "Listen failed: " << WSAGetLastError() << std::endl;
        closesocket(server_fd);
        WSACleanup();
        return 1;
    }

    std::cout << "[OS-Scheduler Engine] HTTP server listening on port " << port << std::endl;

    DonorScheduler scheduler;

    while (true) {
        sockaddr_in client_addr{};
        int client_len = sizeof(client_addr);
        SOCKET client = accept(server_fd, (sockaddr*)&client_addr, &client_len);
        if (client == INVALID_SOCKET) {
            std::cerr << "Accept failed: " << WSAGetLastError() << std::endl;
            continue;
        }

        // Set receive timeout
        DWORD timeout = 5000;
        setsockopt(client, SOL_SOCKET, SO_RCVTIMEO, (const char*)&timeout, sizeof(timeout));

        HttpRequest req = parseRequest(client);

        if (!req.method.empty()) {
            std::string response = handleRoute(scheduler, req);
            send(client, response.c_str(), static_cast<int>(response.size()), 0);
        }

        shutdown(client, SD_SEND);
        closesocket(client);
    }

    closesocket(server_fd);
    WSACleanup();
    return 0;
}
