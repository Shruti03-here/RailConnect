#ifndef FOOD_ITEM_H
#define FOOD_ITEM_H

#include <string>

// Represents an individual catering menu item (Data Encapsulation)
class FoodItem {
private:
    std::string id;
    std::string name;
    std::string category;
    int price;
    std::string description;
    bool veg;
    bool available;

public:
    FoodItem();
    FoodItem(const std::string& id, const std::string& name, const std::string& category,
             int price, const std::string& description, bool veg = true, bool available = true);

    // Getters (Encapsulation)
    std::string getId() const;
    std::string getName() const;
    std::string getCategory() const;
    int getPrice() const;
    std::string getDescription() const;
    bool isVeg() const;
    bool isAvailable() const;

    // Setters
    void setPrice(int newPrice);
    void setAvailable(bool avail);

    // Serialization helper for JSON API
    std::string toJson() const;
    void display() const;
};

#endif // FOOD_ITEM_H

