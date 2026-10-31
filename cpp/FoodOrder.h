#ifndef FOOD_ORDER_H
#define FOOD_ORDER_H

#include <string>

// Represents an individual passenger food catering order (Data Encapsulation)
class FoodOrder {
private:
    std::string orderId;
    std::string pnr;
    std::string trainNumber;
    std::string passenger;
    std::string deliveryStation;
    std::string itemsSummary;
    int totalAmount;
    std::string orderTime;
    std::string status; // "Confirmed", "Delivered", "Cancelled"

public:
    FoodOrder();
    FoodOrder(const std::string& orderId, const std::string& pnr, const std::string& trainNumber,
              const std::string& passenger, const std::string& deliveryStation,
              const std::string& itemsSummary, int totalAmount,
              const std::string& orderTime, const std::string& status = "Confirmed");

    // Getters
    std::string getOrderId() const;
    std::string getPnr() const;
    std::string getTrainNumber() const;
    std::string getPassenger() const;
    std::string getDeliveryStation() const;
    std::string getItemsSummary() const;
    int getTotalAmount() const;
    std::string getOrderTime() const;
    std::string getStatus() const;
    bool isConfirmed() const;

    // Mutator
    void cancel();
    void setStatus(const std::string& newStatus);

    // Export helpers
    std::string toCsv() const;
    std::string toJson() const;
    void display() const;

    // Static ID generator
    static std::string generateOrderId();
};

#endif // FOOD_ORDER_H

