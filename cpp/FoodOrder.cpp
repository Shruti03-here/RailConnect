#include "FoodOrder.h"
#include "Utils.h"
#include <iostream>
#include <ctime>
#include <cstdlib>

FoodOrder::FoodOrder()
    : orderId(""), pnr(""), trainNumber(""), passenger(""), deliveryStation(""),
      itemsSummary(""), totalAmount(0), orderTime(""), status("Confirmed") {}

FoodOrder::FoodOrder(const std::string& orderId, const std::string& pnr, const std::string& trainNumber,
                     const std::string& passenger, const std::string& deliveryStation,
                     const std::string& itemsSummary, int totalAmount,
                     const std::string& orderTime, const std::string& status)
    : orderId(orderId), pnr(pnr), trainNumber(trainNumber), passenger(passenger),
      deliveryStation(deliveryStation), itemsSummary(itemsSummary), totalAmount(totalAmount),
      orderTime(orderTime), status(status) {}

std::string FoodOrder::getOrderId() const {
    return orderId;
}

std::string FoodOrder::getPnr() const {
    return pnr;
}

std::string FoodOrder::getTrainNumber() const {
    return trainNumber;
}

std::string FoodOrder::getPassenger() const {
    return passenger;
}

std::string FoodOrder::getDeliveryStation() const {
    return deliveryStation;
}

std::string FoodOrder::getItemsSummary() const {
    return itemsSummary;
}

int FoodOrder::getTotalAmount() const {
    return totalAmount;
}

std::string FoodOrder::getOrderTime() const {
    return orderTime;
}

std::string FoodOrder::getStatus() const {
    return status;
}

bool FoodOrder::isConfirmed() const {
    return status == "Confirmed";
}

void FoodOrder::cancel() {
    status = "Cancelled";
}

void FoodOrder::setStatus(const std::string& newStatus) {
    status = newStatus;
}

std::string FoodOrder::toCsv() const {
    return orderId + "," + pnr + "," + trainNumber + "," + clean(passenger) + "," + 
           clean(deliveryStation) + "," + clean(itemsSummary) + "," + 
           std::to_string(totalAmount) + "," + clean(orderTime) + "," + status;
}

std::string FoodOrder::toJson() const {
    return "{\"order_id\":\"" + jsonEscape(orderId) + 
           "\",\"pnr\":\"" + jsonEscape(pnr) + 
           "\",\"train_number\":\"" + jsonEscape(trainNumber) + 
           "\",\"passenger\":\"" + jsonEscape(passenger) + 
           "\",\"delivery_station\":\"" + jsonEscape(deliveryStation) + 
           "\",\"items_summary\":\"" + jsonEscape(itemsSummary) + 
           "\",\"total_amount\":" + std::to_string(totalAmount) + 
           ",\"order_time\":\"" + jsonEscape(orderTime) + 
           "\",\"status\":\"" + jsonEscape(status) + "\"}";
}

void FoodOrder::display() const {
    std::cout << "Order #" << orderId << " | PNR: " << pnr << " | Train: " << trainNumber 
              << " | Passenger: " << passenger << " | Station: " << deliveryStation 
              << " | Total: Rs." << totalAmount << " | Status: " << status << "\n"
              << "   Items: " << itemsSummary << "\n";
}

std::string FoodOrder::generateOrderId() {
    long long now = static_cast<long long>(time(nullptr));
    int extra = rand() % 9000 + 1000;
    return "FO-" + std::to_string(now).substr(5) + std::to_string(extra);
}

