import pandas as pd
import numpy as np
import os
import json
from collections import defaultdict

def safe_float(val):
    try:
        return float(val)
    except:
        return 0.0

def format_ip(ip):
    try:
        ip = float(ip)
        whole = int(ip)
        frac = round((ip - whole) * 10)
        if frac == 1:
            return whole + 1/3
        elif frac == 2:
            return whole + 2/3
        return whole
    except:
        return 0.0

def load_data(file_path):
    xls = pd.ExcelFile(file_path)
    gamelog = xls.parse("GameLog")
    schedule = xls.parse("Schedule")
    return gamelog, schedule

def generate_schedule(schedule_df):
    schedule = []
    for _, row in schedule_df.iterrows():
        schedule.append({
            "game_id": str(row["Game ID"]),
            "date": str(row["Date"]),
            "home_team": row["Home"],
            "away_team": row["Away"],
            "home_score": row["Home Score"],
            "away_score": row["Away Score"],
            "completed": bool(row["Played"])
        })
    return schedule

def generate_standings(schedule_df):
    teams = defaultdict(lambda: {"W": 0, "L": 0})
    for _, row in schedule_df.iterrows():
        if not row["Played"]:
            continue
        home, away = row["Home"], row["Away"]
        hs, as_ = row["Home Score"], row["Away Score"]
        if hs > as_:
            teams[home]["W"] += 1
            teams[away]["L"] += 1
        else:
            teams[away]["W"] += 1
            teams[home]["L"] += 1

    max_wins = max((v["W"] for v in teams.values()), default=0)
    standings = []
    for team, rec in teams.items():
        w, l = rec["W"], rec["L"]
        standings.append({
            "team": team,
            "W": w,
            "L": l,
            "Win%": round(w / (w + l), 3) if (w + l) > 0 else 0.0,
            "GB": round((max_wins - w), 1)
        })
    return standings

def group_stats(gamelog_df):
    batting, pitching, fielding = defaultdict(lambda: defaultdict(float)), defaultdict(lambda: defaultdict(float)), defaultdict(lambda: defaultdict(float))
    boxscores = defaultdict(lambda: {"batting": defaultdict(list), "pitching": defaultdict(list), "meta": {}})

    for _, row in gamelog_df.iterrows():
        game_id = str(row["Game ID"])
        team = row["Team"]
        player = row["Player"]
        pid = row["Player ID"]
        pos = row.get("POS", "")
        bop = row.get("BOP", "")
        removed = row.get("Removed", "")

        # Boxscore setup
        meta_fields = ["Date", "Home", "Away", "Home Score", "Away Score"]
        for field in meta_fields:
            if field not in boxscores[game_id]["meta"]:
                boxscores[game_id]["meta"][field.lower().replace(" ", "_")] = row.get(field, "")

        # Batting
        if not pd.isna(row.get("AB")):
            bline = {
                "Player": player,
                "BOP": int(bop) if bop else None,
                "AB": int(row.get("AB", 0)),
                "H": int(row.get("H", 0)),
                "2B": int(row.get("2B", 0)),
                "3B": int(row.get("3B", 0)),
                "HR": int(row.get("HR", 0)),
                "BB": int(row.get("BB", 0)),
                "SO": int(row.get("SO", 0)),
                "R": int(row.get("R", 0)),
                "RBI": int(row.get("RBI", 0)),
                "Removed": removed if removed else None
            }
            boxscores[game_id]["batting"][team].append(bline)
            for stat in bline:
                if stat != "Player" and stat != "BOP" and stat != "Removed":
                    batting[(pid, team)][stat] += bline[stat]

        # Pitching
        if not pd.isna(row.get("IP")):
            ip = format_ip(row.get("IP", 0))
            pstats = {
                "IP": ip,
                "ER": int(row.get("ER", 0)),
                "H": int(row.get("H allowed", 0)),
                "BB": int(row.get("BB against", 0)),
                "SO": int(row.get("SO against", 0)),
                "HR": int(row.get("HR allowed", 0)),
                "W": int(row.get("W", 0)),
                "L": int(row.get("L", 0)),
                "SV": int(row.get("SV", 0))
            }
            boxscores[game_id]["pitching"][team].append({"Player": player, **pstats})
            for k, v in pstats.items():
                pitching[(pid, team)][k] += v

            # CG / SHO candidate tagging
            pitching[(pid, team)][f"GAMES_{game_id}"] = ip
            pitching[(pid, team)][f"SHO_{game_id}"] = (ip >= 9 and row.get("R against", 0) == 0)

        # Fielding
        if not pd.isna(row.get("INN")):
            inn = format_ip(row.get("INN", 0))
            fstats = {
                "PO": int(row.get("PO", 0)),
                "A": int(row.get("A", 0)),
                "E": int(row.get("ERR", 0)),
                "INN": inn
            }
            key = (pid, team, pos)
            for k, v in fstats.items():
                fielding[key][k] += v

    return batting, pitching, fielding, boxscores

def save_json(data, path):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    input_file = "data/1999 Replay.xlsx"
    output_dir = "data/stats"
    boxscore_dir = "data/boxscores"

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(boxscore_dir, exist_ok=True)

    gamelog_df, schedule_df = load_data(input_file)
    schedule = generate_schedule(schedule_df)
    standings = generate_standings(schedule_df)
    batting, pitching, fielding, boxscores = group_stats(gamelog_df)

    # Save schedule and standings
    save_json(schedule, os.path.join(output_dir, "schedule.json"))
    save_json(standings, os.path.join(output_dir, "standings.json"))

    # Save player stats
    save_json([{"Player ID": k[0], "team": k[1], **v} for k, v in batting.items()], os.path.join(output_dir, "batting.json"))
    save_json([{"Player ID": k[0], "team": k[1], **v} for k, v in pitching.items()], os.path.join(output_dir, "pitching.json"))
    save_json([{"Player ID": k[0], "team": k[1], "POS": k[2], **v} for k, v in fielding.items()], os.path.join(output_dir, "fielding.json"))

    # Save boxscores
    for gid, data in boxscores.items():
        save_json(data, os.path.join(boxscore_dir, f"{gid}.json"))
