# RailConnect — Railway Management System

A college OOP course project with a C++ core, a modern web-style dashboard, a Flask bridge, and CSV file storage. It also includes a separate terminal menu.

## Features
- Add and list trains
- Book tickets and generate a PNR
- View reservations
- Cancel active reservations and restore seat availability
- Revenue and network statistics
- CSV persistence in `data/`
- C++ terminal menu
- GUI dashboard with search, forms, tables, and status indicators

## Requirements (Windows)
1. Python 3.10+ installed and added to PATH
2. A C++ compiler that provides `g++` (for example, MinGW-w64) installed and added to PATH
3. VS Code (recommended)

Check the tools in VS Code terminal:
```powershell
python --version
g++ --version
```

## Run the GUI
Open the `RailConnect` folder in VS Code. In the integrated terminal, run:
```powershell
python -m pip install -r requirements.txt
python app.py
```
Open the local address printed in the terminal (usually `http://127.0.0.1:5000`).

The Flask app automatically compiles `cpp/railway.cpp` to `railway.exe` on first run. Keep the terminal running while using the GUI. Press `Ctrl+C` in the terminal to stop the server.

## Run the terminal version
Open a second terminal in the same project folder:
```powershell
g++ cpp/railway.cpp -std=c++17 -o railway.exe
.\railway.exe terminal
```
Use the menu shown in the terminal. For passenger/train names with spaces, the terminal version currently expects underscores (e.g. `Deccan_Express`); the GUI accepts spaces.

## Data
The app creates `data/trains.csv` and `data/bookings.csv` automatically. Four sample trains are inserted on first run. Do not delete these files if you want to preserve your records.

## OOP concepts to explain in viva
- Classes and objects: this starter version uses functions and structured records; expand it into `Train`, `Passenger`, `Reservation`, and `RailwaySystem` classes for a stronger OOP demonstration.
- Encapsulation: put record data and operations inside classes, exposing only public methods.
- File handling: CSV files store train and reservation data.
- Modular design: C++ performs core railway operations; Flask serves the GUI and passes requests to the compiled C++ program.

## Important limitations
This is an educational local demo, not a real railway booking system. PNRs are demo identifiers, there is no payment system or authentication, and CSV storage is intended for a single local user. Do not use real sensitive passenger data.
