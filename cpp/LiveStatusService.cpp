#include "LiveStatusService.h"
#include "Utils.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <algorithm>

LiveStatusService::LiveStatusService()
    : csvFilePath("data/live_status.csv") {
    initializeSimulatedFleet();
    loadFromCsv();
}

LiveStatusService::LiveStatusService(const std::string& csvPath)
    : csvFilePath(csvPath) {
    initializeSimulatedFleet();
    loadFromCsv();
}

void LiveStatusService::initializeSimulatedFleet() {
    statusList.clear();

    // ------------------------------------------------------------------------
    // 1. Train 12101 — Deccan Express (Pune -> Mumbai CSMT)
    // ------------------------------------------------------------------------
    TrainStatus deccan("12101", "Deccan Express", "Pune", "Mumbai",
                       "Lonavala", "Karjat", 8,
                       "Departed Lonavala - Running 8 mins late", 72, 120, "Live - 2 mins ago");
    deccan.addStation(StationStatus("Pune Junction", "PUNE", "—", "—", "07:15", "07:15", 0, 0, "Passed", "PF 1"));
    deccan.addStation(StationStatus("Shivajinagar", "SHV", "07:22", "07:22", "07:23", "07:23", 0, 3, "Passed", "PF 2"));
    deccan.addStation(StationStatus("Khadki", "KK", "07:29", "07:30", "07:30", "07:31", 1, 8, "Passed", "PF 1"));
    deccan.addStation(StationStatus("Chinchwad", "CCH", "07:49", "07:51", "07:50", "07:52", 2, 22, "Passed", "PF 2"));
    deccan.addStation(StationStatus("Talegaon", "TGN", "08:16", "08:20", "08:17", "08:21", 4, 46, "Passed", "PF 1"));
    deccan.addStation(StationStatus("Lonavala", "LNL", "08:45", "08:53", "08:48", "08:56", 8, 72, "Current", "PF 2"));
    deccan.addStation(StationStatus("Khandala", "KDL", "09:04", "09:12", "09:05", "09:13", 8, 84, "Upcoming", "PF 1"));
    deccan.addStation(StationStatus("Karjat", "KJT", "09:44", "09:52", "09:47", "09:55", 8, 132, "Upcoming", "PF 2"));
    deccan.addStation(StationStatus("Thane", "TNA", "10:32", "10:39", "10:34", "10:41", 7, 178, "Upcoming", "PF 5"));
    deccan.addStation(StationStatus("Dadar", "DR", "10:48", "10:54", "10:50", "10:56", 6, 186, "Upcoming", "PF 6"));
    deccan.addStation(StationStatus("Mumbai CSMT", "CSMT", "11:05", "11:10", "—", "—", 5, 192, "Upcoming", "PF 8"));
    statusList.push_back(deccan);

    // ------------------------------------------------------------------------
    // 2. Train 11007 — Deccan Queen (Pune -> Mumbai CSMT)
    // ------------------------------------------------------------------------
    TrainStatus queen("11007", "Deccan Queen", "Pune", "Mumbai",
                      "Talegaon", "Lonavala", 0,
                      "Passed Talegaon - Running On Time", 46, 146, "Live - Just now");
    queen.addStation(StationStatus("Pune Junction", "PUNE", "—", "—", "07:15", "07:15", 0, 0, "Passed", "PF 1"));
    queen.addStation(StationStatus("Shivajinagar", "SHV", "07:22", "07:22", "07:24", "07:24", 0, 3, "Passed", "PF 2"));
    queen.addStation(StationStatus("Khadki", "KK", "07:30", "07:30", "07:31", "07:31", 0, 8, "Passed", "PF 1"));
    queen.addStation(StationStatus("Chinchwad", "CCH", "07:48", "07:48", "07:50", "07:50", 0, 22, "Passed", "PF 2"));
    queen.addStation(StationStatus("Talegaon", "TGN", "08:13", "08:13", "08:15", "08:15", 0, 46, "Current", "PF 1"));
    queen.addStation(StationStatus("Lonavala", "LNL", "08:43", "08:43", "08:48", "08:48", 0, 72, "Upcoming", "PF 2"));
    queen.addStation(StationStatus("Karjat", "KJT", "09:36", "09:36", "09:38", "09:38", 0, 132, "Upcoming", "PF 3"));
    queen.addStation(StationStatus("Thane", "TNA", "10:30", "10:30", "10:32", "10:32", 0, 178, "Upcoming", "PF 6"));
    queen.addStation(StationStatus("Dadar", "DR", "10:48", "10:48", "10:50", "10:50", 0, 186, "Upcoming", "PF 5"));
    queen.addStation(StationStatus("Mumbai CSMT", "CSMT", "11:00", "11:00", "—", "—", 0, 192, "Upcoming", "PF 9"));
    statusList.push_back(queen);

    // ------------------------------------------------------------------------
    // 3. Train 12127 — Intercity Express (Pune -> Mumbai CSMT)
    // ------------------------------------------------------------------------
    TrainStatus intercity("12127", "Intercity Express", "Pune", "Mumbai",
                          "Karjat", "Thane", 12,
                          "Departed Karjat - Running 12 mins late", 132, 60, "Live - 3 mins ago");
    intercity.addStation(StationStatus("Pune Junction", "PUNE", "—", "—", "06:30", "06:30", 0, 0, "Passed", "PF 3"));
    intercity.addStation(StationStatus("Talegaon", "TGN", "07:10", "07:14", "07:12", "07:16", 4, 46, "Passed", "PF 1"));
    intercity.addStation(StationStatus("Lonavala", "LNL", "07:30", "07:38", "07:33", "07:41", 8, 72, "Passed", "PF 2"));
    intercity.addStation(StationStatus("Karjat", "KJT", "08:10", "08:22", "08:12", "08:24", 12, 132, "Current", "PF 3"));
    intercity.addStation(StationStatus("Thane", "TNA", "09:30", "09:41", "09:32", "09:43", 11, 178, "Upcoming", "PF 5"));
    intercity.addStation(StationStatus("Mumbai CSMT", "CSMT", "09:55", "10:05", "—", "—", 10, 192, "Upcoming", "PF 7"));
    statusList.push_back(intercity);

    // ------------------------------------------------------------------------
    // 4. Train 12025 — Shatabdi Express (Pune -> Hyderabad Deccan)
    // ------------------------------------------------------------------------
    TrainStatus shatabdi("12025", "Shatabdi Express", "Pune", "Hyderabad",
                         "Solapur", "Gulbarga", 5,
                         "Departed Solapur - Running 5 mins late", 188, 378, "Live - 1 min ago");
    shatabdi.addStation(StationStatus("Pune Junction", "PUNE", "—", "—", "05:45", "05:45", 0, 0, "Passed", "PF 2"));
    shatabdi.addStation(StationStatus("Daund Junction", "DD", "06:55", "06:57", "06:57", "06:59", 2, 63, "Passed", "PF 1"));
    shatabdi.addStation(StationStatus("Solapur", "SUR", "09:00", "09:05", "09:10", "09:15", 5, 188, "Current", "PF 1"));
    shatabdi.addStation(StationStatus("Gulbarga", "GR", "11:20", "11:25", "11:25", "11:30", 5, 345, "Upcoming", "PF 2"));
    shatabdi.addStation(StationStatus("Wadi Junction", "WADI", "12:05", "12:10", "12:08", "12:13", 5, 393, "Upcoming", "PF 1"));
    shatabdi.addStation(StationStatus("Raichur", "RC", "13:00", "13:04", "13:05", "13:09", 4, 448, "Upcoming", "PF 2"));
    shatabdi.addStation(StationStatus("Yadgir", "YG", "13:45", "13:48", "13:47", "13:50", 3, 497, "Upcoming", "PF 1"));
    shatabdi.addStation(StationStatus("Hyderabad Deccan", "HYB", "16:45", "16:48", "—", "—", 3, 566, "Upcoming", "PF 4"));
    statusList.push_back(shatabdi);
}

void LiveStatusService::loadFromCsv() {
    std::ifstream in(csvFilePath);
    if (!in.is_open()) return;

    std::string line;
    std::getline(in, line); // Skip header

    while (std::getline(in, line)) {
        if (line.empty()) continue;
        std::stringstream ss(line);
        std::string num, name, src, dst, curr, next, delayStr, summary, covStr, remStr, upd;

        if (std::getline(ss, num, ',') &&
            std::getline(ss, name, ',') &&
            std::getline(ss, src, ',') &&
            std::getline(ss, dst, ',') &&
            std::getline(ss, curr, ',') &&
            std::getline(ss, next, ',') &&
            std::getline(ss, delayStr, ',') &&
            std::getline(ss, summary, ',') &&
            std::getline(ss, covStr, ',') &&
            std::getline(ss, remStr, ',') &&
            std::getline(ss, upd)) {

            // Update matched train in statusList if present
            for (auto& ts : statusList) {
                if (ts.getTrainNumber() == num) {
                    ts.setCurrentStation(curr);
                    ts.setNextStation(next);
                    try {
                        ts.setOverallDelayMinutes(std::stoi(delayStr));
                    } catch (...) {}
                    ts.setStatusSummary(summary);
                    ts.setLastUpdated(upd);
                    break;
                }
            }
        }
    }
}

const TrainStatus* LiveStatusService::findStatus(const std::string& query) const {
    if (query.empty()) return nullptr;
    std::string q = toLower(query);

    // Exact or substring match against train number or train name
    for (const auto& ts : statusList) {
        std::string num = toLower(ts.getTrainNumber());
        std::string name = toLower(ts.getTrainName());
        if (num == q || name.find(q) != std::string::npos) {
            return &ts;
        }
    }
    return nullptr;
}

const std::vector<TrainStatus>& LiveStatusService::getAllStatuses() const {
    return statusList;
}

void LiveStatusService::displayStatusJson(const std::string& query) const {
    const TrainStatus* ts = findStatus(query);
    if (!ts) {
        std::cout << "{\"ok\":false,\"error\":\"Train not found for running status query: "
                  << jsonEscape(query) << "\"}\n";
        return;
    }
    std::cout << "{\"ok\":true,\"status\":" << ts->toJson() << "}\n";
}

void LiveStatusService::displayAllStatusesJson() const {
    std::cout << "{\"ok\":true,\"trains\":[";
    for (size_t i = 0; i < statusList.size(); ++i) {
        if (i > 0) std::cout << ",";
        std::cout << "{\"train_number\":\"" << jsonEscape(statusList[i].getTrainNumber()) << "\","
                  << "\"train_name\":\"" << jsonEscape(statusList[i].getTrainName()) << "\","
                  << "\"source\":\"" << jsonEscape(statusList[i].getSource()) << "\","
                  << "\"destination\":\"" << jsonEscape(statusList[i].getDestination()) << "\","
                  << "\"current_station\":\"" << jsonEscape(statusList[i].getCurrentStation()) << "\","
                  << "\"next_station\":\"" << jsonEscape(statusList[i].getNextStation()) << "\","
                  << "\"overall_delay_minutes\":" << statusList[i].getOverallDelayMinutes() << ","
                  << "\"status_summary\":\"" << jsonEscape(statusList[i].getStatusSummary()) << "\","
                  << "\"last_updated\":\"" << jsonEscape(statusList[i].getLastUpdated()) << "\"}";
    }
    std::cout << "]}\n";
}

