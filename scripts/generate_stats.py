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

def convert_sets_to_lists(obj):
    """Recursively convert sets in a nested dict or list to lists for JSON serialization."""
    if isinstance(obj, dict):
        return {k: convert_sets_to_lists(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_sets_to_lists(v) for v in obj]
    elif isinstance(obj, set):
        return list(obj)
    else:
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

def clean_for_json(obj):
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    return obj

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
    linescore = xls.parse("Linescores")
    return gamelog, schedule, linescore

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
            "AVG": "1.000" if avg == 1 else f"{avg:.3f}".lstrip("0"),
            "OBP": "1.000" if obp == 1 else f"{obp:.3f}".lstrip("0"),
            "SLG": f"{slg:.3f}" if slg >= 1 else f"{slg:.3f}".lstrip("0"),
            "OPS": f"{ops:.3f}" if ops >= 1 else f"{ops:.3f}".lstrip("0"),
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
            "ERA": f"{era:.2f}",
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
            "H9": f"{h9:.1f}",
            "HR9": f"{hr9:.1f}",
            "BB9": f"{bb9:.1f}",
            "SO9": f"{so9:.1f}",
            "SO/BB": f"{so_bb:.1f}",
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
        fielding[key]["SB"] += safe_int(row.get("SB against"))
        fielding[key]["CS"] += safe_int(row.get("CS against"))
        fielding[key]["PkO"] += safe_int(row.get("Pko"))

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

def generate_boxscores(gamelog_df, schedule_df):
    def safe_str(val):
        return str(val) if not pd.isna(val) else ""

    stat_list = [
        "AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "IBB", "SO", "SB", "CS", "GDP", "HBP", "SH", "SF",
        "W", "L", "SV", "IP", "H allowed", "R against", "ER", "HR allowed", "BB against", "IBB against",
        "SO against", "HBP against", "BK", "WP", "PO", "A", "ERR", "DP", "TP", "PB", "SB against",
        "CS against", "Pko"
    ]
        
    game_lookup = {}
    for _, row in schedule_df.iterrows():
        game_num = row["Game#"]
        game_id = row["Game ID"]
        if not pd.isna(game_num) and not pd.isna(game_id):
            game_lookup[int(game_num)] = str(game_id)

    boxscores = defaultdict(lambda: {
        "meta": {},
        "batting": defaultdict(lambda: defaultdict(dict)),
        "pitching": defaultdict(lambda: defaultdict(dict)),
        "batting_order": defaultdict(list),
        "positions": defaultdict(lambda: defaultdict(set)),
        "games_started": defaultdict(lambda: defaultdict(int))
    })

    for _, row in gamelog_df.iterrows():
        game_num = row["Game#"]
        if pd.isna(game_num):
            continue
        game_id = game_lookup.get(int(game_num))
        if not game_id:
            continue  # skip unknown games

        # Set meta data from schedule_df instead of gamelog row
        if game_id and "meta" in boxscores[game_id] and not boxscores[game_id]["meta"]:
            sched_row = schedule_df[schedule_df["Game ID"] == game_id].iloc[0]
            boxscores[game_id]["meta"] = {
                "date": safe_str(sched_row.get("Date")),
                "home": safe_str(sched_row.get("Home")),
                "away": safe_str(sched_row.get("Away")),
                "home_score": safe_str(sched_row.get("Home Score")),
                "away_score": safe_str(sched_row.get("Away Score"))
    }


        team = row["Team"]
        player = row["Player Name"]
        pid = row["Player ID"]
        bop = safe_int(row.get("BOP"))
        gs = safe_int(row.get("GS"))
        pos = str(row.get("POS")) if not pd.isna(row.get("POS")) else ""

        if pos and pos != 'DH':
            boxscores[game_id]["positions"][team][player].add(pos)

        if bop > 0:
            boxscores[game_id]["batting_order"][team].append((bop, player))
        if gs:
            boxscores[game_id]["games_started"][team][player] += gs

        for stat in stat_list:
            val = row.get(stat, 0)
            if pd.notna(val):
                # Batting section (if BOP > 0)
                if bop > 0:
                    if "Player" not in boxscores[game_id]["batting"][team][player]:
                        boxscores[game_id]["batting"][team][player]["Player"] = player
                        boxscores[game_id]["batting"][team][player]["Player ID"] = pid
                    if stat not in boxscores[game_id]["batting"][team][player]:
                        boxscores[game_id]["batting"][team][player][stat] = 0
                    if stat == "IP":
                        boxscores[game_id]["batting"][team][player][stat] = format_ip_for_display(val)
                    else:
                        boxscores[game_id]["batting"][team][player][stat] += safe_int(val)

                # Pitching section (if POS == '1')
                if pos == '1':
                    if "Player" not in boxscores[game_id]["pitching"][team][player]:
                        boxscores[game_id]["pitching"][team][player]["Player"] = player
                        boxscores[game_id]["pitching"][team][player]["Player ID"] = pid
                    if stat not in boxscores[game_id]["pitching"][team][player]:
                        boxscores[game_id]["pitching"][team][player][stat] = 0
                    if stat == "IP":
                        boxscores[game_id]["pitching"][team][player][stat] = format_ip_for_display(val)
                    else:
                        boxscores[game_id]["pitching"][team][player][stat] += safe_int(val)


    return boxscores

if __name__ == "__main__":
    input_file = "data/1999 Replay.xlsx"
    output_dir = "data/stats"
    os.makedirs(output_dir, exist_ok=True)

    gamelog_df, schedule_df, linescore_df = load_data(input_file)
    
    batting_stats = group_stats(gamelog_df)
    pitching_stats = group_pitching_stats(gamelog_df, schedule_df)
    fielding_stats = group_fielding_stats(gamelog_df)
    boxscores = generate_boxscores(gamelog_df, schedule_df)
    os.makedirs("data/boxscores", exist_ok=True)
    for gid, raw_data in boxscores.items():
        cleaned = convert_sets_to_lists(raw_data)
        with open(os.path.join("data/boxscores", f"{gid}.json"), "w") as f:
            json.dump(cleaned, f, indent=2)



    # Generate schedule.json
    schedule_data = []
    for _, row in schedule_df.iterrows():
        game = {
            "id": str(row.get("Game ID")),
            "date": row["Date"].date().isoformat() if not pd.isna(row["Date"]) else "",
            "home_team": row.get("Home"),
            "away_team": row.get("Away"),
            "home_score": safe_int(row.get("Home Score")),
            "away_score": safe_int(row.get("Away Score")),
            "simDate": "" if pd.isna(row.get("Played On")) else str(row.get("Played On")).strip(),
            "completed": str(row.get("Played", "")).strip().lower() == "yes"
        }
        schedule_data.append(game)

    save_json(schedule_data, os.path.join(output_dir, "schedule.json"))

    # Generate standings.json
    standings = {}
    for game in schedule_data:
        if not game["completed"]:
            continue

        home = game["home_team"]
        away = game["away_team"]
        home_score = game["home_score"]
        away_score = game["away_score"]

        if home_score is None or away_score is None:
            continue

        for team in [home, away]:
            if team not in standings:
                standings[team] = {"W": 0, "L": 0}

        if home_score > away_score:
            standings[home]["W"] += 1
            standings[away]["L"] += 1
        else:
            standings[away]["W"] += 1
            standings[home]["L"] += 1

    with open("data/teams.json", "r") as tf:
        teams = json.load(tf)

    team_meta = {t["id"]: {"league": t["league"], "division": t["division"]} for t in teams}
    all_team_ids = [t["id"] for t in teams]

    complete = {}
    for tid in all_team_ids:
        record = standings.get(tid, {"W": 0, "L": 0})
        wins = record["W"]
        losses = record["L"]
        total = wins + losses
        pct = wins / total if total > 0 else 0
        record["W-L%"] = "1.000" if pct == 1 else f".{int(round(pct * 1000)):03d}"
        complete[tid] = record

    from collections import defaultdict
    grouped = defaultdict(lambda: defaultdict(list))
    for team_id, record in complete.items():
        meta = team_meta.get(team_id)
        if meta:
            league = meta["league"]
            division = meta["division"]
            grouped[league][division].append({"team": team_id, **record})

    league_order = ["AL", "NL"]
    division_order = ["East", "Central", "West"]
    ordered = {}

for league in league_order:
    if league in grouped:
        ordered[league] = {}
        for division in division_order:
            if division in grouped[league]:
                teams = grouped[league][division]

                # Sort by Win Percentage: W / (W + L)
                sorted_teams = sorted(
                    teams,
                    key=lambda t: -(t["W"] / (t["W"] + t["L"]) if (t["W"] + t["L"]) > 0 else 0)
                )

                # Determine GB relative to leader
                leader = sorted_teams[0]
                leader_W, leader_L = leader["W"], leader["L"]

                for team in sorted_teams:
                    w, l = team["W"], team["L"]
                    if (w == leader_W and l == leader_L):
                        team["GB"] = "--"
                    else:
                        gb = ((leader_W - w) + (l - leader_L)) / 2
                        team["GB"] = round(gb, 1)

                ordered[league][division] = sorted_teams
    save_json(ordered, os.path.join(output_dir, "standings.json"))

# --- START linescores.json GENERATION BLOCK ---
completed_game_ids = {
    str(row["Game ID"]).strip()
    for _, row in schedule_df.iterrows()
    if str(row.get("Played", "")).strip().lower() == "yes"
}

linescore_data = {}
inning_cols = [col for col in linescore_df.columns if isinstance(col, int)]
inning_cols = sorted(inning_cols)

for _, row in linescore_df.iterrows():
    game_id = str(row["Game ID"]).strip()
    team = str(row["Team"]).strip()

    if game_id not in completed_game_ids:
        continue

    innings = []
    for col in inning_cols:
        val = row.get(col)
        if pd.isna(val):
            innings.append("")
        else:
            innings.append(str(int(val)) if isinstance(val, float) and val.is_integer() else str(val).strip())

    if not any(v.strip() for v in innings):
        continue

    if game_id not in linescore_data:
        linescore_data[game_id] = {}

    linescore_data[game_id][team] = innings

save_json(linescore_data, os.path.join(output_dir, "linescores.json"))
# --- END linescores.json GENERATION BLOCK ---

def compute_fielding_by_position(gamelog_df):
    fielding = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))
    games = defaultdict(lambda: defaultdict(set))

    for _, row in gamelog_df.iterrows():
        pid = row.get("Player ID")
        if pd.isna(pid) or pid == "":
            continue

        pos = row.get("POS", "")
        if pos not in range(1, 10):
            continue

        team = row["Team"]
        player = row["Player Name"]
        game_id = row["Game#"]
        key = (pid, team, pos)

        games[(pid, team)][pos].add(game_id)
        f = fielding[(pid, team)][pos]

        f["Player"] = player
        f["GS"] += safe_int(row.get("GS"))
        f["CG"] += safe_int(row.get("CG"))
        f["INN"] += safe_float(row.get("INN"))
        f["PO"] += safe_int(row.get("PO"))
        f["A"] += safe_int(row.get("A"))
        f["E"] += safe_int(row.get("ERR"))
        f["DP"] += safe_int(row.get("DP"))
        f["PB"] += safe_int(row.get("PB"))
        f["WP"] += safe_int(row.get("WP"))
        f["SB"] += safe_int(row.get("SB against"))
        f["CS"] += safe_int(row.get("CS against"))
        f["PkO"] += safe_int(row.get("Pko"))

    results = []
    for (pid, team), pos_dict in fielding.items():
        for pos, stats in pos_dict.items():
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
                "POS": str(pos),
                "G": len(games[(pid, team)][pos]),
                "GS": int(stats["GS"]),
                "CG": int(stats["CG"]),
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
            results.append(entry)
    return results

if __name__ == "__main__":
    gamelog_df, schedule_df, linescore_df = load_data("data/1999 Replay.xlsx")
    fielding_by_pos = compute_fielding_by_position(gamelog_df)

    with open("data/stats/fielding_by_position.json", "w") as f:
        json.dump(clean_for_json(fielding_by_pos), f, indent=2)

    print("fielding_by_position.json generated.")

save_json(batting_stats, os.path.join(output_dir, "batting.json"))
save_json(pitching_stats, os.path.join(output_dir, "pitching.json"))
save_json(fielding_stats, os.path.join(output_dir, "fielding.json"))

