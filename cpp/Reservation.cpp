#include "Reservation.h"
#include "Utils.h"

// Definition of static data member
int Reservation::activeBookingsCount = 0;

Reservation::Reservation(const std::string& pnr, const std::string& tNo, 
                         const std::string& pass, int a, const std::string& g, 
                         int f, const std::string& stat)
    : Record(pnr), trainNumber(tNo), passenger(pass, a, g), fare(f), status(stat) {}

Reservation::Reservation(const std::string& pnr, const std::string& tNo,
                         const Passenger& pass, int f, const std::string& stat)
    : Record(pnr), trainNumber(tNo), passenger(pass), fare(f), status(stat) {}

std::ostream& operator<<(std::ostream& os, const Reservation& b) {
    os << "PNR " << b.id << " | " << b.passenger.getName() << " | Train " << b.trainNumber 
       << " | Rs." << b.fare << " | " << b.status;
    return os;
}

void Reservation::display() const {
    std::cout << *this << "\n";
}

std::string Reservation::toCsv() const {
    return id + "," + trainNumber + "," + passenger.getName() + "," + 
           std::to_string(passenger.getAge()) + "," + passenger.getGender() + "," + 
           std::to_string(fare) + "," + status;
}

std::string Reservation::toJson() const {
    return "{\"pnr\":\"" + jsonEscape(id) + 
           "\",\"train_number\":\"" + jsonEscape(trainNumber) +
           "\",\"passenger\":\"" + jsonEscape(passenger.getName()) + 
           "\",\"age\":" + std::to_string(passenger.getAge()) +
           ",\"gender\":\"" + jsonEscape(passenger.getGender()) + 
           "\",\"fare\":" + std::to_string(fare) + 
           ",\"status\":\"" + jsonEscape(status) + "\"}";
}

void Reservation::cancel() {
    if (status == "Confirmed") {
        status = "Cancelled";
        if (activeBookingsCount > 0) activeBookingsCount--;
    }
}

std::string Reservation::generatePNR() {
    return makePNR();
}

