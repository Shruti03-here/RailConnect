#ifndef TRAIN_STATUS_H
#define TRAIN_STATUS_H

#include <string>
#include <vector>
#include "StationStatus.h"

/**
 * TrainStatus models the comprehensive real-time status of a running train.
 * Demonstrates Composition: a TrainStatus HAS-A collection of StationStatus objects.
 */
class TrainStatus {
private:
    std::string trainNumber;
    std::string trainName;
    std::string source;
    std::string destination;
    std::string currentStation;
    std::string nextStation;
    int overallDelayMinutes;
    std::string statusSummary;
    int distanceCoveredKm;
    int distanceRemainingKm;
    std::string lastUpdated;
    std::vector<StationStatus> route;

public:
    TrainStatus();
    TrainStatus(const std::string& number, const std::string& name,
                const std::string& src, const std::string& dst,
                const std::string& currStn, const std::string& nextStn,
                int delay, const std::string& summary, int distCovered,
                int distRemaining, const std::string& updated);

    // Getters
    std::string getTrainNumber() const;
    std::string getTrainName() const;
    std::string getSource() const;
    std::string getDestination() const;
    std::string getCurrentStation() const;
    std::string getNextStation() const;
    int getOverallDelayMinutes() const;
    std::string getStatusSummary() const;
    int getDistanceCoveredKm() const;
    int getDistanceRemainingKm() const;
    std::string getLastUpdated() const;
    const std::vector<StationStatus>& getRoute() const;

    // Composition method
    void addStation(const StationStatus& station);

    // Setters
    void setCurrentStation(const std::string& curr);
    void setNextStation(const std::string& next);
    void setOverallDelayMinutes(int delay);
    void setStatusSummary(const std::string& summary);
    void setLastUpdated(const std::string& updated);

    // JSON Serializer for Flask IPC
    std::string toJson() const;
};

#endif // TRAIN_STATUS_H

