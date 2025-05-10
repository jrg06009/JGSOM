import pandas as pd
import json
import os
from collections import defaultdict

def generate_schedule_and_standings(excel_path, output_folder, teams_json_path="data/teams.json"):
    xls = pd.ExcelFile(excel_path)
    os.makedirs(output_folder, exist_ok=True)

    # Standings
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

    with open(teams_json_path, "r") as tf:
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

    # Schedule
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
    generate_schedule_and_standings("data/SOM 1999 Full Season Replay.xlsm", "data/stats")