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
                    pid = player.get("id") or player.get("player ID") or player.get("player ID.1") or player.get("Player ID")
                    name = player.get("name") or player.get("Players") or player.get("Players.1") or player.get("Player")
                    if not pid or not name:
                        continue
                    all_players.setdefault(pid, {"id": pid, "name": name, "link": f"/players/{pid}", "batting": {}, "pitching": {}, "fielding": []})
                    if stat_type == "batting":
                        all_players[pid]["batting"].update(player)
                    elif stat_type == "pitching":
                        all_players[pid]["pitching"].update(player)
                    elif stat_type == "fielding":
                        all_players[pid]["fielding"].append(player)
            except Exception as e:
                team_data[stat_type] = f"Error: {str(e)}"

        with open(os.path.join(output_folder, f"{team_id}.json"), "w") as f:
            json.dump(team_data, f, indent=2)

    with open(os.path.join(output_folder, "players_combined.json"), "w") as f:
        json.dump(list(all_players.values()), f, indent=2)

    print("players_combined.json created.")

    # STANDINGS
    print("Generating standings.json...")
    gamelog_df = xls.parse("GameLog").dropna(subset=["Game ID", "Team", "R"])
    gamelog_df["Game ID"] = gamelog_df["Game ID"].astype(str).str.strip()
    gamelog_df["Team"] = gamelog_df["Team"].astype(str).str.strip()
    gamelog_df["R"] = pd.to_numeric(gamelog_df["R"], errors="coerce")
    team_game_scores = gamelog_df.groupby(["Game ID", "Team"])["R"].sum().reset_index()

    standings = defaultdict(lambda: {"W": 0, "L": 0})
    for game_id, group in team_game_scores.groupby("Game ID"):
        if len(group) != 2:
            continue
        team1, team2 = group.iloc[0], group.iloc[1]
        if team1["R"] > team2["R"]:
            standings[team1["Team"]]["W"] += 1
            standings[team2["Team"]]["L"] += 1
        else:
            standings[team2["Team"]]["W"] += 1
            standings[team1["Team"]]["L"] += 1

    with open("data/teams.json", "r") as tf:
        teams = json.load(tf)
    teams_df = pd.DataFrame([{"id": t["id"], "league": t["league"], "division": t["division"]} for t in teams])

    records = []
    for team in teams_df.to_dict(orient="records"):
        tid = team["id"]
        rec = standings.get(tid, {"W": 0, "L": 0})
        W, L = rec["W"], rec["L"]
        pct = f"{W / (W + L):.3f}" if (W + L) > 0 else ".000"
        records.append({
            "id": tid,
            "league": team["league"],
            "division": team["division"],
            "W": W,
            "L": L,
            "pct": pct
        })

    final_standings_output = []
    for league in ["AL", "NL"]:
        for division in ["East", "Central", "West"]:
            subset = pd.DataFrame(records).query("league == @league and division == @division")
            if subset.empty:
                continue
            sorted_div = subset.sort_values(by=["pct", "W"], ascending=[False, False])
            top_wins, top_losses = sorted_div.iloc[0]["W"], sorted_div.iloc[0]["L"]
            block = {
                "league": league,
                "division": division,
                "teams": []
            }
            for _, row in sorted_div.iterrows():
                gb = ((top_wins - row["W"]) + (row["L"] - top_losses)) / 2
                block["teams"].append({
                    "id": row["id"],
                    "W": row["W"],
                    "L": row["L"],
                    "pct": row["pct"],
                    "GB": "-" if gb == 0 else f"{gb:.1f}"
                })
            final_standings_output.append(block)

    with open(os.path.join(output_folder, "standings.json"), "w") as f:
        json.dump(final_standings_output, f, indent=2)

    print("standings.json created.")

    # SCHEDULE
    print("Generating schedule.json...")
    schedule_df = xls.parse("Schedule", usecols="A:O")
    schedule = []
    for _, row in schedule_df.iterrows():
        date = row.get("Date")
        gid = row.get("GameID")
        played = isinstance(gid, str) and "@" in gid
        game = {
            "date": str(date.date()) if not pd.isna(date) else None,
            "played": played,
            "home": str(row.get("act H")).strip().upper() if not played else str(row.get("Home Team")).strip().upper(),
            "road": str(row.get("act R")).strip().upper() if not played else str(row.get("Road Team")).strip().upper(),
            "home_score": row.get("Score.1") if played else None,
            "road_score": row.get("Score") if played else None,
            "game_id": gid if played else None
        }
        schedule.append(game)

    with open(os.path.join(output_folder, "schedule.json"), "w") as f:
        json.dump(schedule, f, indent=2)
    print("schedule.json created.")

if __name__ == "__main__":
    generate_stats_from_excel("data/SOM 1999 Full Season Replay.xlsm", "data/stats")
