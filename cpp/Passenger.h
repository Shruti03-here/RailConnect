#ifndef PASSENGER_H
#define PASSENGER_H

#include <string>

// Represents an individual passenger (Data Encapsulation)
class Passenger {
private:
    std::string name;
    int age;
    std::string gender;

public:
    Passenger(const std::string& name = "", int age = 0, const std::string& gender = "");

    // Getters
    std::string getName() const;
    int getAge() const;
    std::string getGender() const;

    // Setters
    void setName(const std::string& name);
    void setAge(int age);
    void setGender(const std::string& gender);
};

#endif // PASSENGER_H

