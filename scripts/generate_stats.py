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
            batting[key]["GDP"] += safe_int(row.get("GDP"))
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
            "team": team,
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
            "GDP": stats.get("GDP", 0),
            "HBP": hbp,
            "SH": stats.get("SH", 0),
            "SF": sf,
            "IBB": stats.get("IBB", 0),
            "Player ID": pid
        }

        result.append(entry)

    return result

# Future: Implement pitching group_stats() here with full stat and order logic

if __name__ == "__main__":
    input_file = "data/1999 Replay.xlsx"
    output_dir = "data/stats"
    os.makedirs(output_dir, exist_ok=True)

    gamelog_df, schedule_df = load_data(input_file)
    batting_stats = group_stats(gamelog_df)

    save_json(batting_stats, os.path.join(output_dir, "batting.json"))

    # Placeholder for pitching.json generation
    pitching_stats = group_pitching_stats(gamelog_df, schedule_df)
    save_json(pitching_stats, os.path.join(output_dir, 'pitching.json'))
    # save_json(pitching_stats, os.path.join(output_dir, "pitching.json"))



def group_pitching_stats(gamelog_df, schedule_df):
    pitching = defaultdict(lambda: defaultdict(float))
    games = defaultdict(set)

    for _, row in gamelog_df.iterrows():
        pid = row.get("Player ID")
        if pd.isna(pid) or pid == "":
            continue

        team = row["Team"]
        player = row["Player Name"]
        game_id = row["Game#"]
        key = (pid, team)

        ip = safe_float(row.get("IP", 0))
        pitching[key]["Player"] = player
        pitching[key]["IP"] += ip
        pitching[key]["W"] += safe_int(row.get("W"))
        pitching[key]["L"] += safe_int(row.get("L"))
        pitching[key]["SV"] += safe_int(row.get("SV"))
        pitching[key]["GS"] += safe_int(row.get("GS"))
        pitching[key]["CG"] += safe_int(row.get("CG"))
        pitching[key]["SHO"] += safe_int(row.get("SHO"))
        pitching[key]["H"] += safe_int(row.get("H allowed"))
        pitching[key]["R"] += safe_int(row.get("R against"))
        pitching[key]["ER"] += safe_int(row.get("ER"))
        pitching[key]["HR"] += safe_int(row.get("HR allowed"))
        pitching[key]["BB"] += safe_int(row.get("BB against"))
        pitching[key]["IBB"] += safe_int(row.get("IBB against"))
        pitching[key]["SO"] += safe_int(row.get("SO against"))
        pitching[key]["HBP"] += safe_int(row.get("HBP against"))
        pitching[key]["BK"] += safe_int(row.get("BK"))
        pitching[key]["WP"] += safe_int(row.get("WP"))
        games[key].add(game_id)

    result = []
    for (pid, team), stats in pitching.items():
        ip = stats.get("IP", 0)
        er = stats.get("ER", 0)
        h = stats.get("H", 0)
        hr = stats.get("HR", 0)
        bb = stats.get("BB", 0)
        so = stats.get("SO", 0)

        era = round((er * 9 / ip), 2) if ip else 0.00
        h9 = round(h * 9 / ip, 1) if ip else 0.0
        hr9 = round(hr * 9 / ip, 1) if ip else 0.0
        bb9 = round(bb * 9 / ip, 1) if ip else 0.0
        so9 = round(so * 9 / ip, 1) if ip else 0.0
        so_bb = round(so / bb, 1) if bb else 0.0

        w = stats.get("W", 0)
        l = stats.get("L", 0)
        wl_pct = round(w / (w + l), 3) if (w + l) else 0.000

        entry = {
            "Player": stats["Player"],
            "team": team,
            "W": w,
            "L": l,
            "W-L%": wl_pct,
            "ERA": era,
            "G": len(games[(pid, team)]),
            "GS": stats.get("GS", 0),
            "CG": stats.get("CG", 0),
            "SHO": stats.get("SHO", 0),
            "SV": stats.get("SV", 0),
            "IP": round(ip, 2),
            "H": h,
            "R": stats.get("R", 0),
            "ER": er,
            "HR": hr,
            "BB": bb,
            "IBB": stats.get("IBB", 0),
            "SO": so,
            "HBP": stats.get("HBP", 0),
            "BK": stats.get("BK", 0),
            "WP": stats.get("WP", 0),
            "H9": h9,
            "HR9": hr9,
            "BB9": bb9,
            "SO9": so9,
            "SO/BB": so_bb,
            "Player ID": pid
        }

        result.append(entry)

    return result
