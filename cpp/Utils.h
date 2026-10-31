#ifndef UTILS_H
#define UTILS_H

#include <string>
#include <vector>
#include <sstream>
#include <stdexcept>
#include <ctime>
#include <cstdlib>

// Custom Exception Class for Railway Operations
class RailwayException : public std::exception {
private:
    std::string msg;
public:
    explicit RailwayException(const std::string& message) : msg(message) {}
    virtual const char* what() const noexcept override {
        return msg.c_str();
    }
};

// Cleans input strings by replacing commas, newlines, and pipe characters
inline std::string clean(std::string s) {
    for (char &c : s) {
        if (c == ',' || c == '\n' || c == '\r' || c == '|') c = ' ';
        if (c == '"') c = '\'';
    }
    return s;
}

// Escapes special characters for valid JSON formatting
inline std::string jsonEscape(const std::string& s) {
    std::string out;
    for (char c : s) {
        if (c == '\\') out += "\\\\";
        else if (c == '"') out += "\\\"";
        else if (c == '\n') out += "\\n";
        else if (c == '\r') out += "\\r";
        else out += c;
    }
    return out;
}

// Splits a delimited string into tokens
inline std::vector<std::string> split(const std::string& line, char delim = ',') {
    std::vector<std::string> out;
    std::string item;
    std::stringstream ss(line);
    while (std::getline(ss, item, delim)) {
        out.push_back(item);
    }
    return out;
}

// Converts string to lower case for case-insensitive searching
inline std::string toLower(std::string s) {
    for (char &c : s) {
        c = static_cast<char>(::tolower(static_cast<unsigned char>(c)));
    }
    return s;
}

// Generates a unique 10-digit PNR based on timestamp and random number
inline std::string makePNR() {
    long long now = static_cast<long long>(time(nullptr));
    int extra = rand() % 900 + 100;
    return std::to_string(now).substr(3) + std::to_string(extra);
}

#endif // UTILS_H

