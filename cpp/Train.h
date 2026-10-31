#ifndef TRAIN_H
#define TRAIN_H

#include <string>
#include <iostream>
#include "Record.h"

// Derived Class: Train (Represents train route and seat inventory)
class Train : public Record {
private: // Data Encapsulation
    std::string name;
    std::string source;
    std::string destination;
    int fare;
    int seats;

public:
    Train(const std::string& no = "", const std::string& nm = "", 
          const std::string& src = "", const std::string& dst = "", 
          int f = 0, int s = 0);
    Train(const Train& other);
    virtual ~Train() override = default;

    // Overloading Insertion Operator (Friend function)
    friend std::ostream& operator<<(std::ostream& os, const Train& t);

    // Overriding Base Class pure virtual methods (Runtime Polymorphism)
    void display() const override;
    std::string toCsv() const override;
    std::string toJson() const override;

    // Getters
    std::string getNumber() const { return id; }
    std::string getName() const { return name; }
    std::string getSource() const { return source; }
    std::string getDestination() const { return destination; }
    int getSeats() const { return seats; }
    int getFare() const { return fare; }

    // Mutators & Business logic
    void setSeats(int seats) { this->seats = seats; }
    void setFare(int fare) { this->fare = fare; }
    bool bookSeat();
    void cancelSeat();

    // Operator Overloading for equality and ordering
    bool operator==(const Train& other) const { return id == other.id; }
    bool operator<(const Train& other) const { return id < other.id; }
};

#endif // TRAIN_H

