#ifndef CATERING_SERVICE_H
#define CATERING_SERVICE_H

#include <vector>
#include <string>
#include "FoodItem.h"
#include "FoodOrder.h"

// Coordinates catering menu and orders (Demonstrates Composition with FoodItem and FoodOrder)
class CateringService {
private:
    static const std::string ORDERS_FILE;

    // Composition: CateringService HAS-A menu of FoodItem objects and a list of FoodOrder objects
    std::vector<FoodItem> menu;
    std::vector<FoodOrder*> orders;

    void initializeDefaultMenu();
    void clearOrders();
    void loadOrders();
    void saveOrders();
    void ensureOrdersFile();

public:
    CateringService();
    ~CateringService();

    // Disable copy constructor and assignment
    CateringService(const CateringService&) = delete;
    CateringService& operator=(const CateringService&) = delete;

    const std::vector<FoodItem>& getMenu() const;
    const std::vector<FoodOrder*>& getOrders() const;

    FoodOrder* findOrder(const std::string& orderId) const;

    // Business actions
    std::string placeOrder(const std::string& pnr, const std::string& trainNumber,
                           const std::string& passenger, const std::string& deliveryStation,
                           const std::string& itemsSummary, int totalAmount);
    std::string cancelOrder(const std::string& orderId);

    // JSON export methods
    std::string getMenuJson() const;
    std::string getOrdersJson();
    std::string getOrdersByPnrJson(const std::string& pnr);

    // Terminal display helpers
    void displayMenuTerminal() const;
    void displayOrdersTerminal();

    // Command Dispatcher for IPC / CLI
    std::string executeCommand(const std::vector<std::string>& args);
};

#endif // CATERING_SERVICE_H

