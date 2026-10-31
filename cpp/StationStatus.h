#ifndef STATION_STATUS_H
#define STATION_STATUS_H

#include <string>

/**
 * StationStatus represents the running status at a particular station on a train's route.
 * Follows OOP Encapsulation with private attributes and public accessors.
 */
class StationStatus {
private:
    std::string stationName;
    std::string stationCode;
    std::string scheduledArrival;
    std::string estimatedArrival;
    std::string scheduledDeparture;
    std::string estimatedDeparture;
    int delayMinutes;
    int distanceKm;
    std::string status;   // "Passed", "Current", "Upcoming"
    std::string platform; // e.g. "PF 1", "PF 2"

public:
    StationStatus();
    StationStatus(const std::string& name, const std::string& code,
                  const std::string& schArr, const std::string& estArr,
                  const std::string& schDep, const std::string& estDep,
                  int delay, int dist, const std::string& stat, const std::string& pf);

    // Getters
    std::string getStationName() const;
    std::string getStationCode() const;
    std::string getScheduledArrival() const;
    std::string getEstimatedArrival() const;
    std::string getScheduledDeparture() const;
    std::string getEstimatedDeparture() const;
    int getDelayMinutes() const;
    int getDistanceKm() const;
    std::string getStatus() const;
    std::string getPlatform() const;

    // Setters
    void setStatus(const std::string& stat);
    void setDelayMinutes(int delay);
    void setEstimatedArrival(const std::string& estArr);
    void setEstimatedDeparture(const std::string& estDep);

    // Serialization for Flask API
    std::string toJson() const;
};

#endif // STATION_STATUS_H

