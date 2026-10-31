#include "Passenger.h"

Passenger::Passenger(const std::string& name, int age, const std::string& gender)
    : name(name), age(age), gender(gender) {}

std::string Passenger::getName() const {
    return name;
}

int Passenger::getAge() const {
    return age;
}

std::string Passenger::getGender() const {
    return gender;
}

void Passenger::setName(const std::string& name) {
    this->name = name;
}

void Passenger::setAge(int age) {
    this->age = age;
}

void Passenger::setGender(const std::string& gender) {
    this->gender = gender;
}

