#include "RailwaySystem.h"
#include "Utils.h"
#include <iostream>
#include <fstream>

const std::string RailwaySystem::DATA_DIR = "data/";
const std::string RailwaySystem::TRAINS_FILE = "data/trains.csv";
const std::string RailwaySystem::BOOKINGS_FILE = "data/bookings.csv";

RailwaySystem::RailwaySystem() {
    ensureFiles();
}

RailwaySystem::~RailwaySystem() {
    clearTrains();
    clearBookings();
}

void RailwaySystem::clearTrains() {
    for (Train* t : trains) {
        delete t;
    }
    trains.clear();
}

void RailwaySystem::clearBookings() {
    for (Booking* b : bookings) {
        delete b;
    }
    bookings.clear();
    Booking::resetActiveBookingsCount();
}

void RailwaySystem::loadTrains() {
    clearTrains();
    std::ifstream in(TRAINS_FILE);
    if (!in) throw RailwayException("File IO Error: " + TRAINS_FILE);
    std::string line;
    std::getline(in, line); // header
    while (std::getline(in, line)) {
        if (line.empty()) continue;
        auto row = split(line);
        if (row.size() >= 6) {
            trains.push_back(new Train(row[0], row[1], row[2], row[3], std::stoi(row[4]), std::stoi(row[5])));
        }
    }
}

void RailwaySystem::loadBookings() {
    clearBookings();
    std::ifstream in(BOOKINGS_FILE);
    if (!in) throw RailwayException("File IO Error: " + BOOKINGS_FILE);
    std::string line;
    std::getline(in, line); // header
    while (std::getline(in, line)) {
        if (line.empty()) continue;
        auto row = split(line);
        if (row.size() >= 7) {
            Booking* b = new Booking(row[0], row[1], row[2], std::stoi(row[3]), row[4], std::stoi(row[5]), row[6]);
            bookings.push_back(b);
            if (b->getStatus() == "Confirmed") {
                Booking::incrementActiveBookingsCount();
            }
        }
    }
}

void RailwaySystem::saveTrains() {
    std::ofstream out(TRAINS_FILE);
    if (!out) throw RailwayException("File IO Error: " + TRAINS_FILE);
    out << "number,name,source,destination,fare,seats\n";
    for (const Train* t : trains) {
        if (t) out << t->toCsv() << "\n";
    }
}

void RailwaySystem::saveBookings() {
    std::ofstream out(BOOKINGS_FILE);
    if (!out) throw RailwayException("File IO Error: " + BOOKINGS_FILE);
    out << "pnr,train_number,passenger,age,gender,fare,status\n";
    for (const Booking* b : bookings) {
        if (b) out << b->toCsv() << "\n";
    }
}

Train* RailwaySystem::findTrain(const std::string& number) const {
    for (Train* t : trains) {
        if (t && t->getId() == number) {
            return t;
        }
    }
    return nullptr;
}

std::vector<Train*> RailwaySystem::findTrain(const std::string& source, const std::string& destination) const {
    std::vector<Train*> matches;
    for (Train* t : trains) {
        if (t && t->getSource() == source && t->getDestination() == destination) {
            matches.push_back(t);
        }
    }
    return matches;
}

Booking* RailwaySystem::findBooking(const std::string& pnr) const {
    for (Booking* b : bookings) {
        if (b && b->getId() == pnr) {
            return b;
        }
    }
    return nullptr;
}

void RailwaySystem::ensureFiles() {
    std::ofstream t(TRAINS_FILE, std::ios::app);
    std::ifstream tin(TRAINS_FILE);
    tin.seekg(0, std::ios::end);
    if (tin.tellg() == 0) {
        t.close();
        std::ofstream out(TRAINS_FILE);
        out << "number,name,source,destination,fare,seats\n";
        out << "12101,Deccan Express,Pune,Mumbai,250,120\n";
        out << "11007,Deccan Queen,Pune,Mumbai,400,80\n";
        out << "12127,Intercity Express,Pune,Mumbai,300,100\n";
        out << "12025,Shatabdi Express,Pune,Hyderabad,850,60\n";
    }
    std::ofstream b(BOOKINGS_FILE, std::ios::app);
    std::ifstream bin(BOOKINGS_FILE);
    bin.seekg(0, std::ios::end);
    if (bin.tellg() == 0) {
        b.close();
        std::ofstream out(BOOKINGS_FILE);
        out << "pnr,train_number,passenger,age,gender,fare,status\n";
    }
}

void RailwaySystem::printTrainsJson() {
    try { loadTrains(); } catch(...) {}
    std::cout << "[";
    for (size_t i = 0; i < trains.size(); ++i) {
        if (i > 0) std::cout << ",";
        std::cout << trains[i]->toJson();
    }
    std::cout << "]";
}

void RailwaySystem::printBookingsJson() {
    try { loadBookings(); } catch(...) {}
    std::cout << "[";
    for (size_t i = 0; i < bookings.size(); ++i) {
        if (i > 0) std::cout << ",";
        std::cout << bookings[i]->toJson();
    }
    std::cout << "]";
}

void RailwaySystem::displayTrainsTerminal() {
    try { loadTrains(); } catch(...) {}
    for (const Train* t : trains) {
        if (t) t->display();
    }
}

void RailwaySystem::displayBookingsTerminal() {
    try { loadBookings(); } catch(...) {}
    for (const Booking* b : bookings) {
        if (b) b->display();
    }
}

bool RailwaySystem::updateTrainSeats(const std::string& number, int delta) {
    try {
        loadTrains();
        Train* t = findTrain(number);
        if (!t) return false;
        int seats = t->getSeats() + delta;
        if (seats < 0) return false;
        t->setSeats(seats);
        saveTrains();
        return true;
    } catch (const std::exception& e) {
        return false;
    }
}

std::string RailwaySystem::executeCommand(const std::vector<std::string>& a) {
    if (a.empty()) return "{\"ok\":false,\"message\":\"Missing command\"}";
    std::string cmd = a[0];

    try {
        if (cmd.rfind("catering-", 0) == 0) {
            return cateringService.executeCommand(a);
        }
        if (cmd == "live-status") {
            if (a.size() < 2) {
                std::cout << "{\"ok\":false,\"error\":\"Please enter a train number or name.\"}\n";
                return "";
            }
            std::string query = clean(a[1]);
            for (char& c : query) { if (c == '_') c = ' '; }
            liveStatusService.displayStatusJson(query);
            return "";
        }
        if (cmd == "live-status-list") {
            liveStatusService.displayAllStatusesJson();
            return "";
        }
        if (cmd == "trains") {
            std::cout << "{\"ok\":true,\"data\":";
            printTrainsJson();
            std::cout << "}";
            return "";
        }
        if (cmd == "bookings") {
            printBookingsJson();
            return "";
        }
        if (cmd == "add-train") {
            if (a.size() < 7) throw RailwayException("Missing train fields");
            std::string number = clean(a[1]), name = clean(a[2]), source = clean(a[3]), dest = clean(a[4]);
            int fare = std::stoi(a[5]), seats = std::stoi(a[6]);
            
            loadTrains();
            if (findTrain(number)) {
                throw RailwayException("Train number already exists");
            }
            
            trains.push_back(new Train(number, name, source, dest, fare, seats));
            saveTrains();
            return "{\"ok\":true,\"message\":\"Train added successfully\"}";
        }
        if (cmd == "book") {
            if (a.size() < 5) throw RailwayException("Missing passenger fields");
            std::string trainNo = a[1], passenger = clean(a[2]), age = a[3], gender = clean(a[4]);
            
            loadTrains();
            Train* targetTrain = findTrain(trainNo);
            if (!targetTrain) throw RailwayException("Train not found");
            if (targetTrain->getSeats() <= 0) throw RailwayException("No seats available");
            
            std::string pnr = makePNR();
            loadBookings();
            Booking* newBooking = new Booking(pnr, trainNo, passenger, std::stoi(age), gender, targetTrain->getFare(), "Confirmed");
            bookings.push_back(newBooking);
            Booking::incrementActiveBookingsCount();
            saveBookings();
            
            targetTrain->setSeats(targetTrain->getSeats() - 1);
            saveTrains();
            return "{\"ok\":true,\"message\":\"Ticket booked successfully\",\"pnr\":\"" + pnr + "\",\"fare\":" + std::to_string(targetTrain->getFare()) + "}";
        }
        if (cmd == "cancel") {
            if (a.size() < 2) throw RailwayException("Enter a PNR");
            std::string pnr = a[1];
            loadBookings();
            
            Booking* targetBooking = findBooking(pnr);
            if (!targetBooking || targetBooking->getStatus() != "Confirmed") {
                throw RailwayException("Active reservation not found");
            }
            
            std::string trainNo = targetBooking->getTrainNumber();
            targetBooking->cancel();
            saveBookings();
            
            loadTrains();
            Train* t = findTrain(trainNo);
            if (t) {
                t->setSeats(t->getSeats() + 1);
                saveTrains();
            }
            return "{\"ok\":true,\"message\":\"Ticket cancelled successfully\"}";
        }
        if (cmd == "stats") {
            loadTrains();
            loadBookings();
            int active = Booking::getActiveBookingsCount();
            int passengers = active;
            int revenue = 0;
            for (const Booking* b : bookings) {
                if (b && b->getStatus() == "Confirmed") {
                    revenue += b->getFare();
                }
            }
            std::cout << "{\"ok\":true,\"trains\":" << trains.size() << ",\"bookings\":" << active
                      << ",\"passengers\":" << passengers << ",\"revenue\":" << revenue << "}";
            return "";
        }
        if (cmd == "terminal") return "terminal";
        
    } catch (const RailwayException& e) {
        return "{\"ok\":false,\"message\":\"" + std::string(e.what()) + "\"}";
    } catch (const std::exception& e) {
        return "{\"ok\":false,\"message\":\"System error\"}";
    }
    return "{\"ok\":false,\"message\":\"Unknown command\"}";
}

