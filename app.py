from flask import Flask, render_template, request, jsonify
import subprocess
import os
import shutil

app = Flask(__name__)
ROOT = os.path.dirname(os.path.abspath(__file__))
CPP_DIR = os.path.join(ROOT, "cpp")
EXE = os.path.join(ROOT, "railway.exe" if os.name == "nt" else "railway")
os.chdir(ROOT)

def ensure_compiled():
    compiler = shutil.which("g++")
    if not compiler:
        raise RuntimeError("g++ was not found. Install MinGW-w64 / a C++ compiler and add it to PATH.")
    
    # Collect all split C++ source and header files
    cpp_files = sorted([os.path.join(CPP_DIR, f) for f in os.listdir(CPP_DIR) if f.endswith(".cpp")])
    if not cpp_files:
        raise RuntimeError("No C++ source files found in " + CPP_DIR)

    header_files = [os.path.join(CPP_DIR, f) for f in os.listdir(CPP_DIR) if f.endswith(".h")]
    all_sources = cpp_files + header_files

    needs_compile = not os.path.exists(EXE)
    if not needs_compile:
        exe_mtime = os.path.getmtime(EXE)
        needs_compile = any(os.path.getmtime(src) > exe_mtime for src in all_sources)

    if needs_compile:
        # On Windows with Smart App Control, compile in user profile / temp and copy to EXE
        build_exe = os.path.join(os.environ.get("USERPROFILE", ROOT), ".railway_build.exe")
        result = subprocess.run([compiler, *cpp_files, "-std=c++17", "-o", build_exe],
                                cwd=ROOT, capture_output=True, text=True)
        if result.returncode == 0 and os.path.exists(build_exe):
            shutil.copy2(build_exe, EXE)
            try:
                os.remove(build_exe)
            except Exception:
                pass
        else:
            result = subprocess.run([compiler, *cpp_files, "-std=c++17", "-o", EXE],
                                    cwd=ROOT, capture_output=True, text=True)
            if result.returncode:
                raise RuntimeError(result.stderr or "C++ compilation failed.")

def run_cpp(*args):
    ensure_compiled()
    result = subprocess.run([EXE, *map(str, args)], cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr or "C++ backend failed.")
    import json
    try:
        return json.loads(result.stdout)
    except Exception:
        raise RuntimeError("Unexpected response from C++ backend: " + result.stdout)

@app.route("/")
def index():
    return render_template("index.html")

@app.get("/api/trains")
def trains():
    try:
        return jsonify(run_cpp("trains"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/api/bookings")
def bookings():
    try:
        return jsonify(run_cpp("bookings"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/api/stats")
def stats():
    try:
        return jsonify(run_cpp("stats"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post("/api/trains")
def add_train():
    data = request.get_json(force=True)
    try:
        number = str(data.get("number", "")).strip()
        name = str(data.get("name", "")).strip()
        source = str(data.get("source", "")).strip()
        destination = str(data.get("destination", "")).strip()
        fare = int(data.get("fare", 0))
        seats = int(data.get("seats", 0))
        if not all([number, name, source, destination]) or fare <= 0 or seats < 0:
            return jsonify({"ok": False, "message": "Fill all fields. Fare must be positive and seats cannot be negative."}), 400
        return jsonify(run_cpp("add-train", number, name, source, destination, fare, seats))
    except ValueError:
        return jsonify({"ok": False, "message": "Fare and seats must be whole numbers."}), 400
    except Exception as e:
        return jsonify({"ok": False, "message": str(e)}), 500

@app.post("/api/book")
def book():
    data = request.get_json(force=True)
    try:
        name = str(data.get("passenger", "")).strip()
        train = str(data.get("train_number", "")).strip()
        age = int(data.get("age", 0))
        gender = str(data.get("gender", "")).strip()
        if not name or not train or not gender or age < 1 or age > 120:
            return jsonify({"ok": False, "message": "Enter valid passenger details."}), 400
        return jsonify(run_cpp("book", train, name, age, gender))
    except ValueError:
        return jsonify({"ok": False, "message": "Age must be a valid number."}), 400
    except Exception as e:
        return jsonify({"ok": False, "message": str(e)}), 500

@app.post("/api/cancel")
def cancel():
    data = request.get_json(force=True)
    try:
        pnr = str(data.get("pnr", "")).strip()
        if not pnr:
            return jsonify({"ok": False, "message": "Enter a PNR number."}), 400
        return jsonify(run_cpp("cancel", pnr))
    except Exception as e:
        return jsonify({"ok": False, "message": str(e)}), 500

@app.get("/api/route/<train_number>")
def get_route(train_number):
    """
    Return route data for a given train number.
    Reads from the trains CSV (same source the C++ engine uses) and augments
    with a hard-coded intermediate-station table for the trains in the sample
    database.  For trains whose intermediate stops are not known we return only
    the terminal stations and set has_full_route=False so the frontend can show
    the appropriate notice.
    """
    import csv

    trains_csv = os.path.join(ROOT, "data", "trains.csv")
    train_info = None
    try:
        with open(trains_csv, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["number"].strip() == str(train_number).strip():
                    train_info = row
                    break
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if not train_info:
        return jsonify({"error": f"Train {train_number} not found"}), 404

    # -------------------------------------------------------------------------
    # Known intermediate-station data for sample trains.
    # -------------------------------------------------------------------------
    KNOWN_ROUTES = {
        "12101": {   # Deccan Express  Pune -> Mumbai CSMT
            "has_full_route": True,
            "journey_duration": "3h 30m",
            "total_distance_km": 192,
            "stops": [
                {"station": "Pune Junction",    "code": "PUNE",  "arrival": "—",     "departure": "07:15", "day": 1, "distance_km": 0},
                {"station": "Shivajinagar",     "code": "SHV",   "arrival": "07:22", "departure": "07:23", "day": 1, "distance_km": 3},
                {"station": "Khadki",           "code": "KK",    "arrival": "07:29", "departure": "07:30", "day": 1, "distance_km": 8},
                {"station": "Dapodi",           "code": "DPD",   "arrival": "07:35", "departure": "07:36", "day": 1, "distance_km": 12},
                {"station": "Kasarwadi",        "code": "KWV",   "arrival": "07:40", "departure": "07:41", "day": 1, "distance_km": 15},
                {"station": "Pimpri",           "code": "PPR",   "arrival": "07:44", "departure": "07:45", "day": 1, "distance_km": 18},
                {"station": "Chinchwad",        "code": "CCH",   "arrival": "07:49", "departure": "07:50", "day": 1, "distance_km": 22},
                {"station": "Akurdi",           "code": "AKI",   "arrival": "07:54", "departure": "07:55", "day": 1, "distance_km": 26},
                {"station": "Dehu Road",        "code": "DHU",   "arrival": "08:00", "departure": "08:01", "day": 1, "distance_km": 31},
                {"station": "Begdewadi",        "code": "BGW",   "arrival": "08:07", "departure": "08:08", "day": 1, "distance_km": 37},
                {"station": "Talegaon",         "code": "TGN",   "arrival": "08:16", "departure": "08:17", "day": 1, "distance_km": 46},
                {"station": "Kanhe",            "code": "KH",    "arrival": "08:24", "departure": "08:25", "day": 1, "distance_km": 54},
                {"station": "Malavli",          "code": "MVL",   "arrival": "08:34", "departure": "08:35", "day": 1, "distance_km": 64},
                {"station": "Lonavala",         "code": "LNL",   "arrival": "08:45", "departure": "08:48", "day": 1, "distance_km": 72},
                {"station": "Monkey Hill",      "code": "MKH",   "arrival": "09:00", "departure": "09:01", "day": 1, "distance_km": 82},
                {"station": "Khandala",         "code": "KDL",   "arrival": "09:04", "departure": "09:05", "day": 1, "distance_km": 84},
                {"station": "Khopoli",          "code": "KPE",   "arrival": "09:15", "departure": "09:16", "day": 1, "distance_km": 100},
                {"station": "Palasdhari",       "code": "PLSD",  "arrival": "09:24", "departure": "09:25", "day": 1, "distance_km": 112},
                {"station": "Neral",            "code": "NRL",   "arrival": "09:33", "departure": "09:34", "day": 1, "distance_km": 122},
                {"station": "Karjat",           "code": "KJT",   "arrival": "09:44", "departure": "09:47", "day": 1, "distance_km": 132},
                {"station": "Khopate",          "code": "KPTE",  "arrival": "09:56", "departure": "09:57", "day": 1, "distance_km": 143},
                {"station": "Pen",              "code": "PEN",   "arrival": "10:08", "departure": "10:09", "day": 1, "distance_km": 156},
                {"station": "Vangani",          "code": "VGI",   "arrival": "10:19", "departure": "10:20", "day": 1, "distance_km": 166},
                {"station": "Thane",            "code": "TNA",   "arrival": "10:32", "departure": "10:34", "day": 1, "distance_km": 178},
                {"station": "Mumbai CSMT",      "code": "CSMT",  "arrival": "10:45", "departure": "—",     "day": 1, "distance_km": 192},
            ]
        },
        "11007": {   # Deccan Queen  Pune -> Mumbai CSMT
            "has_full_route": True,
            "journey_duration": "3h 45m",
            "total_distance_km": 192,
            "stops": [
                {"station": "Pune Junction",    "code": "PUNE",  "arrival": "—",     "departure": "07:15", "day": 1, "distance_km": 0},
                {"station": "Shivajinagar",     "code": "SHV",   "arrival": "07:22", "departure": "07:24", "day": 1, "distance_km": 3},
                {"station": "Khadki",           "code": "KK",    "arrival": "07:30", "departure": "07:31", "day": 1, "distance_km": 8},
                {"station": "Chinchwad",        "code": "CCH",   "arrival": "07:48", "departure": "07:50", "day": 1, "distance_km": 22},
                {"station": "Talegaon",         "code": "TGN",   "arrival": "08:13", "departure": "08:15", "day": 1, "distance_km": 46},
                {"station": "Lonavala",         "code": "LNL",   "arrival": "08:43", "departure": "08:48", "day": 1, "distance_km": 72},
                {"station": "Karjat",           "code": "KJT",   "arrival": "09:36", "departure": "09:38", "day": 1, "distance_km": 132},
                {"station": "Thane",            "code": "TNA",   "arrival": "10:30", "departure": "10:32", "day": 1, "distance_km": 178},
                {"station": "Dadar",            "code": "DR",    "arrival": "10:48", "departure": "10:50", "day": 1, "distance_km": 186},
                {"station": "Mumbai CSMT",      "code": "CSMT",  "arrival": "11:00", "departure": "—",     "day": 1, "distance_km": 192},
            ]
        },
        "12127": {   # Intercity Express  Pune -> Mumbai CSMT
            "has_full_route": True,
            "journey_duration": "3h 25m",
            "total_distance_km": 192,
            "stops": [
                {"station": "Pune Junction",    "code": "PUNE",  "arrival": "—",     "departure": "06:30", "day": 1, "distance_km": 0},
                {"station": "Talegaon",         "code": "TGN",   "arrival": "07:10", "departure": "07:12", "day": 1, "distance_km": 46},
                {"station": "Lonavala",         "code": "LNL",   "arrival": "07:30", "departure": "07:33", "day": 1, "distance_km": 72},
                {"station": "Karjat",           "code": "KJT",   "arrival": "08:10", "departure": "08:12", "day": 1, "distance_km": 132},
                {"station": "Thane",            "code": "TNA",   "arrival": "09:30", "departure": "09:32", "day": 1, "distance_km": 178},
                {"station": "Mumbai CSMT",      "code": "CSMT",  "arrival": "09:55", "departure": "—",     "day": 1, "distance_km": 192},
            ]
        },
        "12025": {   # Shatabdi Express  Pune -> Hyderabad Deccan
            "has_full_route": True,
            "journey_duration": "11h 00m",
            "total_distance_km": 566,
            "stops": [
                {"station": "Pune Junction",    "code": "PUNE",  "arrival": "—",     "departure": "05:45", "day": 1, "distance_km": 0},
                {"station": "Daund Junction",   "code": "DD",    "arrival": "06:55", "departure": "06:57", "day": 1, "distance_km": 63},
                {"station": "Solapur",          "code": "SUR",   "arrival": "09:00", "departure": "09:10", "day": 1, "distance_km": 188},
                {"station": "Gulbarga",         "code": "GR",    "arrival": "11:20", "departure": "11:25", "day": 1, "distance_km": 345},
                {"station": "Wadi Junction",    "code": "WADI",  "arrival": "12:05", "departure": "12:08", "day": 1, "distance_km": 393},
                {"station": "Raichur",          "code": "RC",    "arrival": "13:00", "departure": "13:05", "day": 1, "distance_km": 448},
                {"station": "Yadgir",           "code": "YG",    "arrival": "13:45", "departure": "13:47", "day": 1, "distance_km": 497},
                {"station": "Hyderabad Deccan", "code": "HYB",   "arrival": "16:45", "departure": "—",     "day": 1, "distance_km": 566},
            ]
        },
    }

    num = str(train_number).strip()
    known = KNOWN_ROUTES.get(num)

    if known:
        return jsonify({
            "train_number": train_info["number"].strip(),
            "train_name":   train_info["name"].strip(),
            "source":       train_info["source"].strip(),
            "destination":  train_info["destination"].strip(),
            "fare":         int(train_info["fare"]),
            "has_full_route":    known["has_full_route"],
            "journey_duration":  known["journey_duration"],
            "total_distance_km": known["total_distance_km"],
            "stops":             known["stops"],
        })
    else:
        return jsonify({
            "train_number": train_info["number"].strip(),
            "train_name":   train_info["name"].strip(),
            "source":       train_info["source"].strip(),
            "destination":  train_info["destination"].strip(),
            "fare":         int(train_info["fare"]),
            "has_full_route":    False,
            "journey_duration":  None,
            "total_distance_km": None,
            "stops": [
                {"station": train_info["source"].strip(),      "code": "", "arrival": "—", "departure": "—", "day": 1, "distance_km": 0},
                {"station": train_info["destination"].strip(), "code": "", "arrival": "—", "departure": "—", "day": 1, "distance_km": None},
            ],
        })

# ============================================================================
# E-Catering / Food on Track Endpoints
# ============================================================================
@app.get("/api/catering/menu")
def catering_menu():
    try:
        data = run_cpp("catering-menu")
        return jsonify(data if isinstance(data, list) else data.get("data", []))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/api/catering/orders")
def catering_orders():
    try:
        data = run_cpp("catering-orders")
        return jsonify(data if isinstance(data, list) else data.get("data", []))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/api/catering/orders/<pnr>")
def catering_orders_pnr(pnr):
    try:
        data = run_cpp("catering-orders-pnr", pnr)
        return jsonify(data if isinstance(data, list) else data.get("data", []))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post("/api/catering/order")
def catering_place_order():
    data = request.get_json(force=True)
    try:
        pnr = str(data.get("pnr", "")).strip()
        train_number = str(data.get("train_number", "")).strip()
        passenger = str(data.get("passenger", "")).strip()
        delivery_station = str(data.get("delivery_station", "")).strip()
        
        # Support both items list from shopping cart and direct summary
        items = data.get("items", [])
        items_summary = str(data.get("items_summary", "")).strip()
        total_amount = int(data.get("total_amount", 0))

        if items and not items_summary:
            summary_parts = []
            calculated_total = 0
            for it in items:
                name = str(it.get("name", "Item")).strip()
                qty = int(it.get("quantity", 1))
                price = int(it.get("price", 0))
                summary_parts.append(f"{name} x{qty}")
                calculated_total += (price * qty)
            items_summary = "; ".join(summary_parts)
            if total_amount <= 0:
                total_amount = calculated_total

        if not pnr or not passenger or not items_summary or total_amount <= 0:
            return jsonify({"ok": False, "message": "Please enter passenger name, valid PNR, items, and total amount."}), 400

        # Replace spaces with underscores for safe CLI argument passing to C++ binary
        cli_pnr = pnr.replace(" ", "_")
        cli_train = (train_number or "12101").replace(" ", "_")
        cli_pass = passenger.replace(" ", "_")
        cli_station = (delivery_station or "Coach_Berth").replace(" ", "_")
        cli_items = items_summary.replace(" ", "_")

        result = run_cpp("catering-order", cli_pnr, cli_train, cli_pass, cli_station, cli_items, total_amount)
        # Restore passenger and station display format in returned result
        if isinstance(result, dict):
            if "passenger" in result:
                result["passenger"] = passenger
            if "delivery_station" in result:
                result["delivery_station"] = delivery_station or "Coach Berth"
            if "items_summary" in result:
                result["items_summary"] = items_summary
            return jsonify({"ok": True, "order": result})
        return jsonify({"ok": True, "order": result})
    except ValueError:
        return jsonify({"ok": False, "message": "Total amount must be a number."}), 400
    except Exception as e:
        return jsonify({"ok": False, "message": str(e)}), 500

@app.post("/api/catering/cancel")
def catering_cancel_order():
    data = request.get_json(force=True)
    try:
        order_id = str(data.get("order_id", "")).strip()
        if not order_id:
            return jsonify({"ok": False, "message": "Enter an Order ID to cancel."}), 400
        return jsonify(run_cpp("catering-cancel", order_id))
    except Exception as e:
        return jsonify({"ok": False, "message": str(e)}), 500

# ============================================================================
# Live Train Running Status Endpoints (Simulated Demo Telemetry)
# ============================================================================
@app.get("/api/live-status/trains")
def live_status_trains():
    try:
        data = run_cpp("live-status-list")
        return jsonify(data)
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.get("/api/live-status/search")
def live_status_search():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({"ok": False, "error": "Please enter a train number or train name."}), 400
    try:
        cli_query = query.replace(" ", "_")
        res = run_cpp("live-status", cli_query)
        if isinstance(res, dict) and not res.get("ok"):
            return jsonify(res), 404
        return jsonify(res)
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.get("/api/live-status/<train_query>")
def live_status_detail(train_query):
    query = str(train_query or "").strip()
    if not query:
        return jsonify({"ok": False, "error": "Please enter a train number or train name."}), 400
    try:
        cli_query = query.replace(" ", "_")
        res = run_cpp("live-status", cli_query)
        if isinstance(res, dict) and not res.get("ok"):
            return jsonify(res), 404
        return jsonify(res)
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
