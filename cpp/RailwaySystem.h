#ifndef RAILWAY_SYSTEM_H
#define RAILWAY_SYSTEM_H

#include <vector>
#include <string>
#include "Train.h"
#include "Reservation.h"
#include "CateringService.h"
#include "LiveStatusService.h"

// System Manager & Business Operations Controller
class RailwaySystem {
private:
    static const std::string DATA_DIR;
    static const std::string TRAINS_FILE;
    static const std::string BOOKINGS_FILE;

    // Dynamic memory allocation and pointer collections
    std::vector<Train*> trains;
    std::vector<Booking*> bookings;

    // Composition: RailwaySystem HAS-A CateringService coordinator
    CateringService cateringService;

    // Composition: RailwaySystem HAS-A LiveStatusService telemetry coordinator
    LiveStatusService liveStatusService;

    void clearTrains();
    void clearBookings();
    void loadTrains();
    void loadBookings();
    void saveTrains();
    void saveBookings();

public:
    RailwaySystem();
    ~RailwaySystem();

    // Disable copy constructor and assignment to prevent double-free
    RailwaySystem(const RailwaySystem&) = delete;
    RailwaySystem& operator=(const RailwaySystem&) = delete;

    // Function Overloading 1: Search by unique train number
    Train* findTrain(const std::string& number) const;

    // Function Overloading 2: Search by route (source & destination)
    std::vector<Train*> findTrain(const std::string& source, const std::string& destination) const;

    Booking* findBooking(const std::string& pnr) const;

    void ensureFiles();

    void printTrainsJson();
    void printBookingsJson();

    void displayTrainsTerminal();
    void displayBookingsTerminal();

    CateringService& getCateringService() { return cateringService; }
    const CateringService& getCateringService() const { return cateringService; }

    LiveStatusService& getLiveStatusService() { return liveStatusService; }
    const LiveStatusService& getLiveStatusService() const { return liveStatusService; }

    bool updateTrainSeats(const std::string& number, int delta);

    std::string executeCommand(const std::vector<std::string>& a);
};

#endif // RAILWAY_SYSTEM_H
