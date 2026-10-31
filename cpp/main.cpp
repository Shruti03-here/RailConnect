#include <iostream>
#include <vector>
#include <string>
#include <ctime>
#include <cstdlib>
#include "RailwaySystem.h"

// Terminal interface for command-line interactive use
void terminalMenu(RailwaySystem& system) {
    while (true) {
        std::cout << "\n========== RAILCONNECT RAILWAY MANAGEMENT ==========";
        std::cout << "\n1. Display trains\n2. Book ticket\n3. View reservations\n4. Cancel ticket\n5. Add train\n6. E-Catering Menu\n7. View Food Orders\n8. Live Running Status\n9. Exit\nChoose: ";
        int choice;
        if (!(std::cin >> choice)) return;
        
        if (choice == 1) {
            system.displayTrainsTerminal();
        } else if (choice == 2) {
            std::string train, name, gender;
            int age;
            std::cout << "Train number: "; std::cin >> train;
            std::cout << "Passenger name (use underscores): "; std::cin >> name;
            std::cout << "Age: "; std::cin >> age;
            std::cout << "Gender: "; std::cin >> gender;
            std::cout << system.executeCommand({"book", train, name, std::to_string(age), gender}) << "\n";
        } else if (choice == 3) {
            system.displayBookingsTerminal();
        } else if (choice == 4) {
            std::string pnr;
            std::cout << "PNR: "; std::cin >> pnr;
            std::cout << system.executeCommand({"cancel", pnr}) << "\n";
        } else if (choice == 5) {
            std::string no, name, src, dst;
            int fare, seats;
            std::cout << "Number: "; std::cin >> no;
            std::cout << "Name (use underscores): "; std::cin >> name;
            std::cout << "Source: "; std::cin >> src;
            std::cout << "Destination: "; std::cin >> dst;
            std::cout << "Fare: "; std::cin >> fare;
            std::cout << "Seats: "; std::cin >> seats;
            std::cout << system.executeCommand({"add-train", no, name, src, dst, std::to_string(fare), std::to_string(seats)}) << "\n";
        } else if (choice == 6) {
            system.getCateringService().displayMenuTerminal();
        } else if (choice == 7) {
            system.getCateringService().displayOrdersTerminal();
        } else if (choice == 8) {
            std::string q;
            std::cout << "Enter Train Number or Name: "; std::cin >> q;
            system.executeCommand({"live-status", q});
        } else if (choice == 9) {
            break;
        } else {
            std::cout << "Invalid choice. Try again.\n";
        }
    }
}

// Main execution function
int main(int argc, char* argv[]) {
    std::srand(static_cast<unsigned int>(std::time(nullptr)));
    
    RailwaySystem sys; // Main controller object
    
    if (argc < 2 || std::string(argv[1]) == "terminal") { 
        terminalMenu(sys); 
        return 0; 
    }
    
    std::vector<std::string> args;
    for (int i = 1; i < argc; i++) {
        args.push_back(argv[i]);
    }
    
    std::string cmd = args[0];
    if (cmd == "trains") {
        sys.printTrainsJson();
    } else if (cmd == "bookings") {
        sys.printBookingsJson();
    } else {
        std::string result = sys.executeCommand(args);
        if (!result.empty()) {
            std::cout << result;
        }
    }
    
    return 0;
}

