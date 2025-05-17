
import pandas as pd
import numpy as np
import os
import json
from collections import defaultdict

def safe_int(val):
    try:
        return int(val)
    except:
        return 0

def safe_float(val):
    try:
        return float(val)
    except:
        return 0.0

def clean_for_json(obj):
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    return obj

def save_json(data, path):
    with open(path, "w") as f:
        json.dump(clean_for_json(data), f, indent=2)

def load_data(file_path):
    xls = pd.ExcelFile(file_path)
    gamelog = xls.parse("GameLog")
    schedule = xls.parse("Schedule")
    return gamelog, schedule

def group_stats(gamelog_df):
    batting = defaultdict(lambda: defaultdict(float))
    games_played = defaultdict(set)

    for _, row in gamelog_df.iterrows():
        pid = row.get("Player ID")
        if pd.isna(pid) or pid == "":
            continue

        team = row["Team"]
        player = row["Player Name"]
        game_num = row["Game#"]
        key = (pid, team)

        if not pd.isna(row.get("AB")):
            games_played[key].add(game_num)
            batting[key]["Player"] = player
            batting[key]["AB"] += safe_int(row.get("AB"))
            batting[key]["H"] += safe_int(row.get("H"))
            batting[key]["2B"] += safe_int(row.get("2B"))
            batting[key]["3B"] += safe_int(row.get("3B"))
            batting[key]["HR"] += safe_int(row.get("HR"))
            batting[key]["BB"] += safe_int(row.get("BB"))
            batting[key]["IBB"] += safe_int(row.get("IBB"))
            batting[key]["SO"] += safe_int(row.get("SO"))
            batting[key]["R"] += safe_int(row.get("R"))
            batting[key]["RBI"] += safe_int(row.get("RBI"))
            batting[key]["HBP"] += safe_int(row.get("HBP"))
            batting[key]["SH"] += safe_int(row.get("SH"))
            batting[key]["SF"] += safe_int(row.get("SF"))
            batting[key]["GIDP"] += safe_int(row.get("GIDP"))
            batting[key]["SB"] += safe_int(row.get("SB"))
            batting[key]["CS"] += safe_int(row.get("CS"))

    result = []
    for (pid, team), stats in batting.items():
        ab = stats.get("AB", 0)
        h = stats.get("H", 0)
        bb = stats.get("BB", 0)
        hbp = stats.get("HBP", 0)
        sf = stats.get("SF", 0)
        tb = h + stats.get("2B", 0) + 2 * stats.get("3B", 0) + 3 * stats.get("HR", 0)
        pa = ab + bb + hbp + sf

        avg = round(h / ab, 3) if ab else 0
        obp = round((h + bb + hbp) / pa, 3) if pa else 0
        slg = round(tb / ab, 3) if ab else 0
        ops = round(obp + slg, 3)

        entry = {
            "Player": stats["Player"],
            "Team": team,
            "G": len(games_played[(pid, team)]),
            "PA": pa,
            "AB": ab,
            "R": stats.get("R", 0),
            "H": h,
            "2B": stats.get("2B", 0),
            "3B": stats.get("3B", 0),
            "HR": stats.get("HR", 0),
            "RBI": stats.get("RBI", 0),
            "SB": stats.get("SB", 0),
            "CS": stats.get("CS", 0),
            "BB": bb,
            "SO": stats.get("SO", 0),
            "AVG": avg,
            "OBP": obp,
            "SLG": slg,
            "OPS": ops,
            "TB": tb,
            "GIDP": stats.get("GIDP", 0),
            "HBP": hbp,
            "SH": stats.get("SH", 0),
            "SF": sf,
            "IBB": stats.get("IBB", 0),
            "Player ID": pid
        }

        result.append(entry)

    return result

if __name__ == "__main__":
    input_file = "data/1999 Replay.xlsx"
    output_dir = "data/stats"
    os.makedirs(output_dir, exist_ok=True)

    gamelog_df, schedule_df = load_data(input_file)
    batting_stats = group_stats(gamelog_df)

    save_json(batting_stats, os.path.join(output_dir, "batting.json"))
