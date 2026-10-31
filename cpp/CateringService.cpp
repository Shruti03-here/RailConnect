#include "CateringService.h"
#include "Utils.h"
#include <iostream>
#include <fstream>
#include <ctime>
#include <iomanip>

const std::string CateringService::ORDERS_FILE = "data/food_orders.csv";

CateringService::CateringService() {
    initializeDefaultMenu();
    ensureOrdersFile();
}

CateringService::~CateringService() {
    clearOrders();
}

void CateringService::clearOrders() {
    for (FoodOrder* o : orders) {
        delete o;
    }
    orders.clear();
}

void CateringService::initializeDefaultMenu() {
    menu.clear();
    // 1. Thali & Meals
    menu.emplace_back("F101", "Deluxe Veg Maharaja Thali", "Thali & Meals", 220,
                      "Paneer butter masala, dal makhani, 3 butter rotis, jeera rice, gulab jamun, salad & pickle", true, true);
    menu.emplace_back("F102", "Executive Veg Thali", "Thali & Meals", 150,
                      "Mix veg curry, yellow dal tadka, 3 phulkas, steamed basmati rice, curd & pickle", true, true);
    menu.emplace_back("F103", "Chole Kulche Express Combo", "Thali & Meals", 120,
                      "Authentic Punjabi spiced chole served with 2 soft kulchas and pickled onions", true, true);

    // 2. Biryani & Rice
    menu.emplace_back("F104", "Hyderabadi Veg Dum Biryani", "Biryani & Rice", 170,
                      "Fragrant long-grain basmati layered with seasonal veggies & saffron, with raita", true, true);
    menu.emplace_back("F105", "Desi Ghee Dal Khichdi Tadka", "Biryani & Rice", 130,
                      "Comforting moong dal khichdi tempered with desi ghee, roasted cumin & garlic, with papad", true, true);

    // 3. Breakfast & South Indian
    menu.emplace_back("F106", "South Indian Idli Vada Tiffin", "Breakfast & Snacks", 90,
                      "2 Steamed soft idlis, 1 crispy medu vada served with piping hot sambar & coconut chutney", true, true);
    menu.emplace_back("F107", "Crispy Masala Dosa", "Breakfast & Snacks", 100,
                      "Golden crispy rice crepe stuffed with spiced potato masala, with sambar & chutney", true, true);
    menu.emplace_back("F108", "Maharashtrian Kanda Poha", "Breakfast & Snacks", 70,
                      "Flattened rice sauteed with onions, green chilies, mustard seeds, peanuts and fresh coriander", true, true);

    // 4. Snacks & Quick Bites
    menu.emplace_back("F109", "Hot Samosa Pav Duo (2 pcs)", "Snacks & Fast Food", 60,
                      "Crispy spiced potato samosas tucked inside pav with spicy mint & sweet tamarind chutneys", true, true);
    menu.emplace_back("F110", "Paneer Tikka Kathi Roll", "Snacks & Fast Food", 110,
                      "Tandoori-spiced paneer cubes with crunchy bell peppers rolled in a flaky paratha", true, true);
    menu.emplace_back("F111", "Grilled Veg Cheese Sandwich", "Snacks & Fast Food", 90,
                      "Triple layered butter-toasted sandwich with fresh cucumber, tomato & melted cheese", true, true);

    // 5. Beverages & Desserts
    menu.emplace_back("F112", "Kulhad Masala Chai (2 Cups)", "Beverages & Desserts", 40,
                      "Freshly brewed Indian tea infused with cardamom, ginger, cloves and fresh milk", true, true);
    menu.emplace_back("F113", "South Indian Filter Coffee", "Beverages & Desserts", 50,
                      "Rich and frothy traditional decoction filter coffee brewed with fresh whole milk", true, true);
    menu.emplace_back("F114", "Spiced Amul Buttermilk (Chaas)", "Beverages & Desserts", 30,
                      "Chilled refreshing curd drink blended with mint, ginger, green chili and roasted cumin", true, true);
    menu.emplace_back("F115", "Warm Gulab Jamun (2 pcs)", "Beverages & Desserts", 50,
                      "Soft melt-in-mouth cottage cheese & milk solids dumplings soaked in rose sugar syrup", true, true);
}

void CateringService::ensureOrdersFile() {
    std::ifstream in(ORDERS_FILE);
    if (!in.is_open()) {
        std::ofstream out(ORDERS_FILE);
        out << "order_id,pnr,train_number,passenger,delivery_station,items_summary,total_amount,order_time,status\n";
    }
}

void CateringService::loadOrders() {
    clearOrders();
    std::ifstream in(ORDERS_FILE);
    if (!in.is_open()) return;

    std::string line;
    if (!std::getline(in, line)) return; // skip header line

    while (std::getline(in, line)) {
        if (line.empty()) continue;
        auto row = split(line);
        // Supports 9-column (with delivery_station) and 8-column format
        if (row.size() >= 9) {
            orders.push_back(new FoodOrder(row[0], row[1], row[2], row[3], row[4], 
                                           row[5], std::stoi(row[6]), row[7], row[8]));
        } else if (row.size() >= 8) {
            orders.push_back(new FoodOrder(row[0], row[1], row[2], row[3], "Coach Berth", 
                                           row[4], std::stoi(row[5]), row[6], row[7]));
        }
    }
}

void CateringService::saveOrders() {
    std::ofstream out(ORDERS_FILE);
    if (!out.is_open()) throw RailwayException("File IO Error: " + ORDERS_FILE);
    out << "order_id,pnr,train_number,passenger,delivery_station,items_summary,total_amount,order_time,status\n";
    for (const FoodOrder* o : orders) {
        if (o) out << o->toCsv() << "\n";
    }
}

const std::vector<FoodItem>& CateringService::getMenu() const {
    return menu;
}

const std::vector<FoodOrder*>& CateringService::getOrders() const {
    return orders;
}

FoodOrder* CateringService::findOrder(const std::string& orderId) const {
    for (FoodOrder* o : orders) {
        if (o && o->getOrderId() == orderId) {
            return o;
        }
    }
    return nullptr;
}

static std::string getCurrentTimeString() {
    time_t now = time(nullptr);
    tm* ltm = localtime(&now);
    char buf[64];
    strftime(buf, sizeof(buf), "%d %b %Y, %I:%M %p", ltm);
    return std::string(buf);
}

std::string CateringService::placeOrder(const std::string& pnr, const std::string& trainNumber,
                                        const std::string& passenger, const std::string& deliveryStation,
                                        const std::string& itemsSummary, int totalAmount) {
    if (pnr.empty() || passenger.empty() || itemsSummary.empty() || totalAmount <= 0) {
        throw RailwayException("Invalid food order details");
    }

    loadOrders();
    std::string orderId = FoodOrder::generateOrderId();
    std::string timestamp = getCurrentTimeString();
    std::string station = deliveryStation.empty() ? "Coach Berth" : deliveryStation;

    FoodOrder* newOrder = new FoodOrder(orderId, pnr, trainNumber, passenger, station,
                                        itemsSummary, totalAmount, timestamp, "Confirmed");
    orders.push_back(newOrder);
    saveOrders();

    return "{\"ok\":true,\"message\":\"Food order placed successfully!\",\"order_id\":\"" + orderId + 
           "\",\"pnr\":\"" + jsonEscape(pnr) + 
           "\",\"passenger\":\"" + jsonEscape(passenger) + 
           "\",\"delivery_station\":\"" + jsonEscape(station) + 
           "\",\"items_summary\":\"" + jsonEscape(itemsSummary) + 
           "\",\"total_amount\":" + std::to_string(totalAmount) + 
           ",\"order_time\":\"" + jsonEscape(timestamp) + 
           "\",\"status\":\"Confirmed\"}";
}

std::string CateringService::cancelOrder(const std::string& orderId) {
    if (orderId.empty()) {
        throw RailwayException("Enter a valid Order ID");
    }

    loadOrders();
    FoodOrder* o = findOrder(orderId);
    if (!o) {
        throw RailwayException("Order ID not found: " + orderId);
    }
    if (o->getStatus() == "Cancelled") {
        throw RailwayException("Order is already cancelled");
    }

    o->cancel();
    saveOrders();

    return "{\"ok\":true,\"message\":\"Food order #" + orderId + " has been cancelled successfully.\"}";
}

std::string CateringService::getMenuJson() const {
    std::string json = "[";
    for (size_t i = 0; i < menu.size(); ++i) {
        if (i > 0) json += ",";
        json += menu[i].toJson();
    }
    json += "]";
    return json;
}

std::string CateringService::getOrdersJson() {
    loadOrders();
    std::string json = "[";
    for (size_t i = 0; i < orders.size(); ++i) {
        if (i > 0) json += ",";
        json += orders[i]->toJson();
    }
    json += "]";
    return json;
}

std::string CateringService::getOrdersByPnrJson(const std::string& pnr) {
    loadOrders();
    std::string json = "[";
    bool first = true;
    for (const FoodOrder* o : orders) {
        if (o && o->getPnr() == pnr) {
            if (!first) json += ",";
            json += o->toJson();
            first = false;
        }
    }
    json += "]";
    return json;
}

void CateringService::displayMenuTerminal() const {
    std::cout << "\n========== E-CATERING / FOOD ON TRACK MENU ==========\n";
    for (const auto& item : menu) {
        item.display();
    }
}

void CateringService::displayOrdersTerminal() {
    loadOrders();
    std::cout << "\n========== ACTIVE FOOD ORDERS ==========\n";
    if (orders.empty()) {
        std::cout << "No food orders recorded.\n";
        return;
    }
    for (const auto* order : orders) {
        if (order) order->display();
    }
}

std::string CateringService::executeCommand(const std::vector<std::string>& a) {
    if (a.empty()) return "{\"ok\":false,\"message\":\"Missing catering command\"}";
    std::string cmd = a[0];

    try {
        if (cmd == "catering-menu") {
            return "{\"ok\":true,\"data\":" + getMenuJson() + "}";
        }
        if (cmd == "catering-orders") {
            return "{\"ok\":true,\"data\":" + getOrdersJson() + "}";
        }
        if (cmd == "catering-orders-pnr") {
            if (a.size() < 2) throw RailwayException("Enter a PNR number");
            return "{\"ok\":true,\"data\":" + getOrdersByPnrJson(a[1]) + "}";
        }
        if (cmd == "catering-order") {
            // Arguments: catering-order <pnr> <trainNo> <passenger> <station> <itemsSummary> <totalAmount>
            if (a.size() < 7) throw RailwayException("Missing catering order fields (expected: pnr, train, passenger, station, items, total)");
            std::string pnr = clean(a[1]);
            std::string trainNo = clean(a[2]);
            std::string passenger = clean(a[3]);
            std::string station = clean(a[4]);
            std::string itemsSummary = clean(a[5]);
            int totalAmount = std::stoi(a[6]);
            return placeOrder(pnr, trainNo, passenger, station, itemsSummary, totalAmount);
        }
        if (cmd == "catering-cancel") {
            if (a.size() < 2) throw RailwayException("Enter an Order ID to cancel");
            return cancelOrder(clean(a[1]));
        }
    } catch (const RailwayException& e) {
        return "{\"ok\":false,\"message\":\"" + std::string(e.what()) + "\"}";
    } catch (const std::exception& e) {
        return "{\"ok\":false,\"message\":\"Catering system error: " + std::string(e.what()) + "\"}";
    }
    return "{\"ok\":false,\"message\":\"Unknown catering command\"}";
}

