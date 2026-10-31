#include "FoodItem.h"
#include "Utils.h"
#include <iostream>

FoodItem::FoodItem()
    : id(""), name(""), category(""), price(0), description(""), veg(true), available(true) {}

FoodItem::FoodItem(const std::string& id, const std::string& name, const std::string& category,
                   int price, const std::string& description, bool veg, bool available)
    : id(id), name(name), category(category), price(price),
      description(description), veg(veg), available(available) {}

std::string FoodItem::getId() const {
    return id;
}

std::string FoodItem::getName() const {
    return name;
}

std::string FoodItem::getCategory() const {
    return category;
}

int FoodItem::getPrice() const {
    return price;
}

std::string FoodItem::getDescription() const {
    return description;
}

bool FoodItem::isVeg() const {
    return veg;
}

bool FoodItem::isAvailable() const {
    return available;
}

void FoodItem::setPrice(int newPrice) {
    if (newPrice > 0) {
        price = newPrice;
    }
}

void FoodItem::setAvailable(bool avail) {
    available = avail;
}

std::string FoodItem::toJson() const {
    return "{\"id\":\"" + jsonEscape(id) + 
           "\",\"item_id\":\"" + jsonEscape(id) + 
           "\",\"name\":\"" + jsonEscape(name) + 
           "\",\"category\":\"" + jsonEscape(category) + 
           "\",\"price\":" + std::to_string(price) + 
           ",\"description\":\"" + jsonEscape(description) + 
           "\",\"is_veg\":" + (veg ? "true" : "false") + 
           ",\"available\":" + (available ? "true" : "false") + 
           ",\"is_available\":" + (available ? "true" : "false") + "}";
}

void FoodItem::display() const {
    std::cout << "[" << id << "] " << name << " (" << category << ") - Rs." << price 
              << (veg ? " [VEG]" : "") << (available ? " - Available" : " - Out of stock") << "\n";
}

