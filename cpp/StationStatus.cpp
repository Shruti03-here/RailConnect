#include "StationStatus.h"
#include "Utils.h"

StationStatus::StationStatus()
    : stationName(""), stationCode(""), scheduledArrival("—"), estimatedArrival("—"),
      scheduledDeparture("—"), estimatedDeparture("—"), delayMinutes(0), distanceKm(0),
      status("Upcoming"), platform("PF 1") {}

StationStatus::StationStatus(const std::string& name, const std::string& code,
                             const std::string& schArr, const std::string& estArr,
                             const std::string& schDep, const std::string& estDep,
                             int delay, int dist, const std::string& stat, const std::string& pf)
    : stationName(name), stationCode(code), scheduledArrival(schArr), estimatedArrival(estArr),
      scheduledDeparture(schDep), estimatedDeparture(estDep), delayMinutes(delay),
      distanceKm(dist), status(stat), platform(pf) {}

std::string StationStatus::getStationName() const { return stationName; }
std::string StationStatus::getStationCode() const { return stationCode; }
std::string StationStatus::getScheduledArrival() const { return scheduledArrival; }
std::string StationStatus::getEstimatedArrival() const { return estimatedArrival; }
std::string StationStatus::getScheduledDeparture() const { return scheduledDeparture; }
std::string StationStatus::getEstimatedDeparture() const { return estimatedDeparture; }
int StationStatus::getDelayMinutes() const { return delayMinutes; }
int StationStatus::getDistanceKm() const { return distanceKm; }
std::string StationStatus::getStatus() const { return status; }
std::string StationStatus::getPlatform() const { return platform; }

void StationStatus::setStatus(const std::string& stat) { status = stat; }
void StationStatus::setDelayMinutes(int delay) { delayMinutes = delay; }
void StationStatus::setEstimatedArrival(const std::string& estArr) { estimatedArrival = estArr; }
void StationStatus::setEstimatedDeparture(const std::string& estDep) { estimatedDeparture = estDep; }

std::string StationStatus::toJson() const {
    return "{\"station\":\"" + jsonEscape(stationName) + "\","
           "\"code\":\"" + jsonEscape(stationCode) + "\","
           "\"scheduled_arrival\":\"" + jsonEscape(scheduledArrival) + "\","
           "\"estimated_arrival\":\"" + jsonEscape(estimatedArrival) + "\","
           "\"scheduled_departure\":\"" + jsonEscape(scheduledDeparture) + "\","
           "\"estimated_departure\":\"" + jsonEscape(estimatedDeparture) + "\","
           "\"delay_minutes\":" + std::to_string(delayMinutes) + ","
           "\"distance_km\":" + std::to_string(distanceKm) + ","
           "\"status\":\"" + jsonEscape(status) + "\","
           "\"platform\":\"" + jsonEscape(platform) + "\"}";
}

