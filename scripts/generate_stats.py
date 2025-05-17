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

def format_ip_for_display(ip):
    if pd.isna(ip):
        return "0.0"  # or return "" if you prefer blank
    ip = round(ip, 2)
    whole = int(ip)
    remainder = round((ip - whole) * 100)
    if remainder == 33:
        return f"{whole}.1"
    elif remainder == 67:
        return f"{whole}.2"
    return str(ip)

def compute_fielding_cg(gamelog_df):
    cg_by_player = defaultdict(int)
    filtered = gamelog_df[gamelog_df["POS"].notna() & gamelog_df["Player ID"].notna()]

    for (game, team, pos), group in filtered.groupby(["Game#", "Team", "POS"]):
        if len(group) == 1:
            pid = group.iloc[0]["Player ID"]
            cg_by_player[pid] += 1

    return cg_by_player


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

def group_pitching_stats(gamelog_df, schedule_df):
    cg_sho_counts = defaultdict(lambda: {"CG": 0, "SHO": 0})
    for (game, team), group in gamelog_df[gamelog_df["Player ID"].notna()].groupby(["Game#", "Team"]):
        team_pitchers = group[group["POS"] == 1]
        if len(team_pitchers) == 1:
            row = team_pitchers.iloc[0]
            pid = row["Player ID"]
            cg_sho_counts[pid]["CG"] += 1
            if row.get("R against", 1) == 0:
                cg_sho_counts[pid]["SHO"] += 1
                
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

        if row.get("POS") != 1:
            continue  # Skip players who were not pitchers
        
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

        era = "---" if ip == 0 else round((er * 9 / ip), 2)
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
            "W-L%": "1.000" if wl_pct == 1 else f"{wl_pct:.3f}".lstrip("0"),
            "ERA": era,
            "G": len(games[(pid, team)]),
            "GS": stats.get("GS", 0),
            "CG": cg_sho_counts[pid]["CG"],
            "SHO": cg_sho_counts[pid]["SHO"],
            "SV": stats.get("SV", 0),
            "IP": format_ip_for_display(ip),
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

def group_fielding_stats(gamelog_df):
    cg_by_player = compute_fielding_cg(gamelog_df)
    from collections import defaultdict

    def format_ip_for_display(ip):
        if pd.isna(ip):
            return "0.0"
        ip = round(ip, 2)
        whole = int(ip)
        remainder = round((ip - whole) * 100)
        if remainder == 33:
            return f"{whole}.1"
        elif remainder == 67:
            return f"{whole}.2"
        return str(ip)

    fielding = defaultdict(lambda: defaultdict(float))
    games = defaultdict(set)

    for _, row in gamelog_df.iterrows():
        pid = row.get("Player ID")
        if pd.isna(pid) or pid == "":
            continue

        pos = row.get("POS", "")
        if pos not in range(1, 10):  # skip DH, PH, PR, etc.
            continue

        team = row["Team"]
        player = row["Player Name"]
        game_id = row["Game#"]
        key = (pid, team)

        games[key].add(game_id)
        fielding[key]["Player"] = player
        fielding[key]["GS"] += safe_int(row.get("GS"))
        fielding[key]["CG"] += safe_int(row.get("CG"))
        fielding[key]["INN"] += safe_float(row.get("INN"))
        fielding[key]["PO"] += safe_int(row.get("PO"))
        fielding[key]["A"] += safe_int(row.get("A"))
        fielding[key]["E"] += safe_int(row.get("ERR"))
        fielding[key]["DP"] += safe_int(row.get("DP"))
        fielding[key]["PB"] += safe_int(row.get("PB"))
        fielding[key]["WP"] += safe_int(row.get("WP"))
        fielding[key]["SB"] += safe_int(row.get("SB"))
        fielding[key]["CS"] += safe_int(row.get("CS"))
        fielding[key]["PkO"] += safe_int(row.get("PkO"))

    result = []
    for (pid, team), stats in fielding.items():
        po = stats["PO"]
        a = stats["A"]
        e = stats["E"]
        ch = po + a + e
        fld_pct = (po + a) / ch if ch else None
        sb = stats["SB"]
        cs = stats["CS"]
        cs_pct = (cs / (sb + cs)) if (sb + cs) else None

        entry = {
            "Player": stats["Player"],
            "team": team,
            "G": len(games[(pid, team)]),
            "GS": int(stats["GS"]),
            "CG": cg_by_player.get(pid, 0),
            "Inn": format_ip_for_display(stats["INN"]),
            "Ch": int(ch),
            "PO": int(po),
            "A": int(a),
            "E": int(e),
            "DP": int(stats["DP"]),
            "Fld%": "1.000" if fld_pct == 1 else f"{fld_pct:.3f}".lstrip("0") if fld_pct is not None else "",
            "PB": int(stats["PB"]) if stats["PB"] else "",
            "WP": int(stats["WP"]) if stats["WP"] else "",
            "SB": int(sb) if sb else "",
            "CS": int(cs) if cs else "",
            "CS%": f"{round(cs_pct * 100)}%" if cs_pct is not None else "",
            "PkO": int(stats["PkO"]) if stats["PkO"] else "",
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
    pitching_stats = group_pitching_stats(gamelog_df, schedule_df)
    fielding_stats = group_fielding_stats(gamelog_df)

    save_json(batting_stats, os.path.join(output_dir, "batting.json"))
    save_json(pitching_stats, os.path.join(output_dir, "pitching.json"))
    save_json(fielding_stats, os.path.join(output_dir, "fielding.json"))

