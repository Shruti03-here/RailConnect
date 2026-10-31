#ifndef RECORD_H
#define RECORD_H

#include <string>

// Abstract Base Class (Runtime Polymorphism & Pure Virtual Interface)
class Record {
protected:
    std::string id; // Protected member accessible by derived classes

public:
    explicit Record(const std::string& identifier) : id(identifier) {}
    virtual ~Record() {} // Virtual Destructor

    // Pure Virtual Interface
    virtual void display() const = 0;
    virtual std::string toCsv() const = 0;
    virtual std::string toJson() const = 0;

    std::string getId() const { return id; }
};

#endif // RECORD_H

