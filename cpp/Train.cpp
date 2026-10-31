#include "Train.h"
#include "Utils.h"

Train::Train(const std::string& no, const std::string& nm, 
             const std::string& src, const std::string& dst, 
             int f, int s)
    : Record(no), name(nm), source(src), destination(dst), fare(f), seats(s) {}

Train::Train(const Train& other)
    : Record(other.id), name(other.name), source(other.source), 
      destination(other.destination), fare(other.fare), seats(other.seats) {}

std::ostream& operator<<(std::ostream& os, const Train& t) {
    os << t.id << " | " << t.name << " | " << t.source << " -> " << t.destination 
       << " | Rs." << t.fare << " | Seats: " << t.seats;
    return os;
}

void Train::display() const {
    std::cout << *this << "\n";
}

std::string Train::toCsv() const {
    return id + "," + name + "," + source + "," + destination + "," + 
           std::to_string(fare) + "," + std::to_string(seats);
}

std::string Train::toJson() const {
    return "{\"number\":\"" + jsonEscape(id) + 
           "\",\"name\":\"" + jsonEscape(name) +
           "\",\"source\":\"" + jsonEscape(source) + 
           "\",\"destination\":\"" + jsonEscape(destination) +
           "\",\"fare\":" + std::to_string(fare) + 
           ",\"seats\":" + std::to_string(seats) + "}";
}

bool Train::bookSeat() {
    if (seats > 0) {
        seats--;
        return true;
    }
    return false;
}

void Train::cancelSeat() {
    seats++;
}

