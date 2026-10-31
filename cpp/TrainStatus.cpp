#include "TrainStatus.h"
#include "Utils.h"

TrainStatus::TrainStatus()
    : trainNumber(""), trainName(""), source(""), destination(""),
      currentStation(""), nextStation(""), overallDelayMinutes(0),
      statusSummary(""), distanceCoveredKm(0), distanceRemainingKm(0),
      lastUpdated("Live - Just now") {}

TrainStatus::TrainStatus(const std::string& number, const std::string& name,
                         const std::string& src, const std::string& dst,
                         const std::string& currStn, const std::string& nextStn,
                         int delay, const std::string& summary, int distCovered,
                         int distRemaining, const std::string& updated)
    : trainNumber(number), trainName(name), source(src), destination(dst),
      currentStation(currStn), nextStation(nextStn), overallDelayMinutes(delay),
      statusSummary(summary), distanceCoveredKm(distCovered),
      distanceRemainingKm(distRemaining), lastUpdated(updated) {}

std::string TrainStatus::getTrainNumber() const { return trainNumber; }
std::string TrainStatus::getTrainName() const { return trainName; }
std::string TrainStatus::getSource() const { return source; }
std::string TrainStatus::getDestination() const { return destination; }
std::string TrainStatus::getCurrentStation() const { return currentStation; }
std::string TrainStatus::getNextStation() const { return nextStation; }
int TrainStatus::getOverallDelayMinutes() const { return overallDelayMinutes; }
std::string TrainStatus::getStatusSummary() const { return statusSummary; }
int TrainStatus::getDistanceCoveredKm() const { return distanceCoveredKm; }
int TrainStatus::getDistanceRemainingKm() const { return distanceRemainingKm; }
std::string TrainStatus::getLastUpdated() const { return lastUpdated; }
const std::vector<StationStatus>& TrainStatus::getRoute() const { return route; }

void TrainStatus::addStation(const StationStatus& station) {
    route.push_back(station);
}

void TrainStatus::setCurrentStation(const std::string& curr) { currentStation = curr; }
void TrainStatus::setNextStation(const std::string& next) { nextStation = next; }
void TrainStatus::setOverallDelayMinutes(int delay) { overallDelayMinutes = delay; }
void TrainStatus::setStatusSummary(const std::string& summary) { statusSummary = summary; }
void TrainStatus::setLastUpdated(const std::string& updated) { lastUpdated = updated; }

std::string TrainStatus::toJson() const {
    std::string json = "{\"train_number\":\"" + jsonEscape(trainNumber) + "\","
                       "\"train_name\":\"" + jsonEscape(trainName) + "\","
                       "\"source\":\"" + jsonEscape(source) + "\","
                       "\"destination\":\"" + jsonEscape(destination) + "\","
                       "\"current_station\":\"" + jsonEscape(currentStation) + "\","
                       "\"next_station\":\"" + jsonEscape(nextStation) + "\","
                       "\"overall_delay_minutes\":" + std::to_string(overallDelayMinutes) + ","
                       "\"status_summary\":\"" + jsonEscape(statusSummary) + "\","
                       "\"distance_covered_km\":" + std::to_string(distanceCoveredKm) + ","
                       "\"distance_remaining_km\":" + std::to_string(distanceRemainingKm) + ","
                       "\"last_updated\":\"" + jsonEscape(lastUpdated) + "\","
                       "\"stations\":[";

    for (size_t i = 0; i < route.size(); ++i) {
        if (i > 0) json += ",";
        json += route[i].toJson();
    }
    json += "]}";
    return json;
}

