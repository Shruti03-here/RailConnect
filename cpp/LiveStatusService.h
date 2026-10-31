#ifndef LIVE_STATUS_SERVICE_H
#define LIVE_STATUS_SERVICE_H

#include <string>
#include <vector>
#include "TrainStatus.h"

/**
 * LiveStatusService manages the simulated real-time telemetry and running status
 * of Indian Railway trains in the RailConnect network.
 * Demonstrates Service Layer encapsulation and CSV persistence.
 */
class LiveStatusService {
private:
    std::string csvFilePath;
    std::vector<TrainStatus> statusList;

    void initializeSimulatedFleet();
    void loadFromCsv();

public:
    LiveStatusService();
    explicit LiveStatusService(const std::string& csvPath);

    // Core lookup methods
    const TrainStatus* findStatus(const std::string& query) const;
    const std::vector<TrainStatus>& getAllStatuses() const;

    // JSON Presentation methods for Flask CLI
    void displayStatusJson(const std::string& query) const;
    void displayAllStatusesJson() const;
};

#endif // LIVE_STATUS_SERVICE_H

