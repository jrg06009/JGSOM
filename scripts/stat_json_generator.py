print("=== STARTING STAT GENERATOR ===")

import pandas as pd
import numpy as np
import json
import os
from collections import defaultdict

def format_stat(value, fmt):
    try:
        num = float(value)
        if fmt == ".3f":
            return f"{num:.3f}".lstrip("0") if num != 1 else "1.000"
        elif fmt == ".2f":
            return f"{num:.2f}"
        elif fmt == ".1f":
            return f"{num:.1f}"
        elif fmt == "percent0":
            return f"{int(round(num * 100))}%"
        elif fmt == "ip":
            whole = int(num)
            frac = round((num - whole) * 3)
            return f"{whole}.{frac}"
        else:
            return value
    except:
        return value

def filter_fielding_by_position(player):
    pos = player.get("POS", "")
    filtered = {}
    for k, v in player.items():
        if k in ("SB", "CS", "CS%") and pos not in ("P", "C"):
            continue
        if k == "PB" and pos != "C":
            continue
        if k == "PkO" and pos != "P":
            continue
        filtered[k] = v
    return filtered

def clean_and_format(rows, rules, drop_fields=[], ip_field=None, min_games_field="G"):
    cleaned = []
    for row in rows:
        if min_games_field and str(row.get(min_games_field, "0")) in ("0", "", "0.0"):
            continue
        new_row = {}
        pid = row.get("player ID") or row.get("player ID.1")
        name = row.get("Players") or row.get("Players.1")
        if pid and name:
            new_row["id"] = pid
            new_row["name"] = name
            new_row["link"] = f"/players/{pid}"
        for k, v in row.items():
            if k.upper() in (df.upper() for df in drop_fields):
                continue
            key = "AVG" if k.upper() == "BA" else k
            fmt = rules.get(key)
            new_row[key] = format_stat(v, fmt) if fmt else v
        if ip_field and ip_field in row:
            try:
                float_ip = float(row[ip_field])
                thirds = round((float_ip - int(float_ip)) * 10)
                if thirds == 1:
                    float_ip = int(float_ip) + 1/3
                elif thirds == 2:
                    float_ip = int(float_ip) + 2/3
                new_row[ip_field] = format_stat(float_ip, "ip")
            except:
                pass
        cleaned.append(new_row)
    return cleaned

def generate_stats_from_excel(excel_path, output_folder):
    from pathlib import Path
    xls = pd.ExcelFile(excel_path)
    sheet_names = xls.sheet_names
    team_ids = sorted(set(name.split()[0] for name in sheet_names if " " in name and name.split()[1] in ["B", "P", "F"]))

    os.makedirs(output_folder, exist_ok=True)
    all_players = {}

    for team_id in team_ids:
        team_data = {}
        for stat_type, suffix in [('batting', 'B'), ('pitching', 'P'), ('fielding', 'F')]:
            sheet_name = f"{team_id} {suffix}"
            try:
                df = xls.parse(sheet_name).replace({np.nan: None, pd.NA: None})
                df = df.dropna(how="all")
                records = df.to_dict(orient="records")
                if stat_type == "batting":
                    stats = clean_and_format(records, {
                        "AVG": ".3f", "OBP": ".3f", "SLG": ".3f", "OPS": ".3f"
                    }, drop_fields=["P/S", "MAX"], min_games_field="G")
                elif stat_type == "pitching":
                    stats = clean_and_format(records, {
                        "ERA": ".2f", "WHIP": ".2f", "H9": ".1f", "HR9": ".1f",
                        "BB9": ".1f", "SO9": ".1f", "SO/BB": ".1f"
                    }, drop_fields=["P/S", "MAX"], ip_field="IP", min_games_field="G")
                elif stat_type == "fielding":
                    filtered = clean_and_format(records, {
                        "PCT": ".3f", "CS%": "percent0"
                    }, drop_fields=["P/S", "MAX"], ip_field="INN", min_games_field="G")
                    stats = [filter_fielding_by_position(p) for p in filtered]
                team_data[stat_type] = stats
                for player in stats:
                    pid = player.get("id")
                    if pid:
                        all_players.setdefault(pid, {})
                        all_players[pid].update(player)
            except Exception as e:
                print(f"Error parsing {sheet_name}: {e}")
                continue

        with open(os.path.join(output_folder, f"{team_id}.json"), "w") as f:
            json.dump(team_data, f, indent=2)

    with open(os.path.join(output_folder, "players_combined.json"), "w") as f:
        json.dump(list(all_players.values()), f, indent=2)
    print("players_combined.json created.")
