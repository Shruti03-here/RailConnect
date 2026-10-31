#ifndef RESERVATION_H
#define RESERVATION_H

#include <string>
#include <iostream>
#include "Record.h"
#include "Passenger.h"

// Derived Class: Reservation / Booking (Demonstrates Composition with Passenger)
class Reservation : public Record {
private: // Data Encapsulation
    std::string trainNumber;
    Passenger passenger; // Composition: Reservation HAS-A Passenger
    int fare;
    std::string status;

    // Static Data Member: Tracks active confirmed bookings
    static int activeBookingsCount;

public:
    Reservation(const std::string& pnr = "", const std::string& tNo = "", 
                const std::string& pass = "", int a = 0, const std::string& g = "", 
                int f = 0, const std::string& stat = "Confirmed");
    Reservation(const std::string& pnr, const std::string& tNo,
                const Passenger& pass, int f, const std::string& stat = "Confirmed");

    virtual ~Reservation() override = default;

    // Friend Function: Overloaded insertion operator
    friend std::ostream& operator<<(std::ostream& os, const Reservation& b);

    // Overriding Base Class pure virtual methods (Runtime Polymorphism)
    void display() const override;
    std::string toCsv() const override;
    std::string toJson() const override;

    void cancel();

    // Getters
    std::string getPnr() const { return id; }
    std::string getStatus() const { return status; }
    std::string getTrainNumber() const { return trainNumber; }
    std::string getPassenger() const { return passenger.getName(); }
    const Passenger& getPassengerObj() const { return passenger; }
    int getAge() const { return passenger.getAge(); }
    std::string getGender() const { return passenger.getGender(); }
    int getFare() const { return fare; }

    // Static Member Functions
    static int getActiveBookingsCount() { return activeBookingsCount; }
    static void resetActiveBookingsCount() { activeBookingsCount = 0; }
    static void incrementActiveBookingsCount() { activeBookingsCount++; }
    static std::string generatePNR();
};

// Type alias so both 'Reservation' and 'Booking' can be used interchangeably
using Booking = Reservation;

#endif // RESERVATION_H

