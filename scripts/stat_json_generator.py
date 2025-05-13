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

def clean_and_format(rows, rules, team, drop_fields=[], ip_field=None, min_games_field="G"):
    cleaned = []
    for row in rows:
        if min_games_field and str(row.get(min_games_field, "0")) in ("0", "", "0.0"):
            continue
        new_row = {"team": team}
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

def group_by_player_id(records):
    grouped = defaultdict(list)
    for rec in records:
        pid = rec.get("Player ID") or rec.get("player ID") or rec.get("PlayerID")
        if pid:
            grouped[pid].append(rec)
    return grouped

def merge_totals(records):
    if not records:
        return []
    keys = set().union(*(r.keys() for r in records))
    total = {"team": "TOT"}
    for k in keys:
        if k in {"team", "POS"}:
            continue
        vals = [float(r[k]) for r in records if k in r and isinstance(r[k], (int, float, str)) and str(r[k]).replace('.', '', 1).isdigit()]
        if vals:
            total[k] = round(sum(vals), 3)
    return records + [total]

def generate_stats_from_excel(excel_path, output_folder):
    xls = pd.ExcelFile(excel_path)
    sheet_names = xls.sheet_names
    team_ids = sorted(set(name.split()[0] for name in sheet_names if " " in name and name.split()[1] in ["B", "P", "F"]))
    os.makedirs(output_folder, exist_ok=True)

    all_players = defaultdict(lambda: {"batting": [], "pitching": [], "fielding": []})

    for team_id in team_ids:
        team_data = {}

        # Batting
        try:
            df = xls.parse(f"{team_id} B").replace({np.nan: None, pd.NA: None}).dropna(how="all")
            batting = clean_and_format(df.to_dict(orient="records"), {
                "AVG": ".3f", "OBP": ".3f", "SLG": ".3f", "OPS": ".3f"
            }, team_id, drop_fields=["P/S", "MAX"], min_games_field="G")
            team_data["batting"] = batting
            for row in batting:
                pid = row.get("Player ID") or row.get("player ID") or row.get("PlayerID")
                name = row.get("Player") or row.get("Players")
                if pid and name:
                    all_players[pid]["name"] = name
                    all_players[pid]["id"] = pid
                    all_players[pid]["link"] = f"/players/{pid}"
                    all_players[pid]["batting"].append(row)
        except Exception as e:
            team_data["batting"] = f"Error: {str(e)}"

        # Pitching
        try:
            df = xls.parse(f"{team_id} P").replace({np.nan: None, pd.NA: None}).dropna(how="all")
            pitching = clean_and_format(df.to_dict(orient="records"), {
                "ERA": ".2f", "WHIP": ".2f", "H9": ".1f", "HR9": ".1f",
                "BB9": ".1f", "SO9": ".1f", "SO/BB": ".1f"
            }, team_id, drop_fields=["P/S", "MAX"], ip_field="IP", min_games_field="G")
            team_data["pitching"] = pitching
            for row in pitching:
                pid = row.get("Player ID") or row.get("player ID") or row.get("PlayerID")
                name = row.get("Player") or row.get("Players")
                if pid and name:
                    all_players[pid]["name"] = name
                    all_players[pid]["id"] = pid
                    all_players[pid]["link"] = f"/players/{pid}"
                    all_players[pid]["pitching"].append(row)
        except Exception as e:
            team_data["pitching"] = f"Error: {str(e)}"

        # Fielding
        try:
            df = xls.parse(f"{team_id} F").replace({np.nan: None, pd.NA: None}).dropna(how="all")
            raw_rows = df.to_dict(orient="records")
            cleaned = []
            for row in raw_rows:
                if str(row.get("G", "0")) in ("0", "", "0.0"):
                    continue

                new_row = {"team": team_id}
                for k, v in row.items():
                    if k in ["P/S", "MAX"]:
                        continue
                    new_row[k] = v

                # Recalculate Fld Pct = (PO + A) / (PO + A + E)
                po = float(row.get("PO") or 0)
                a = float(row.get("A") or 0)
                e = float(row.get("E") or 0)
                fld_pct = (po + a) / (po + a + e) if (po + a + e) > 0 else 0
                new_row["Fld Pct"] = format_stat(fld_pct, ".3f")

                # Recalculate CS% = whole % value
                cs = float(row.get("CS") or 0)
                sb = float(row.get("SB") or 0)
                cs_pct = int(round(100 * cs / (cs + sb))) if (cs + sb) > 0 else 0
                new_row["CS%"] = f"{cs_pct}%"

                cleaned.append(new_row)

            team_data["fielding"] = cleaned

            for row in cleaned:
                pid = row.get("Player ID") or row.get("player ID") or row.get("PlayerID")
                name = row.get("Player") or row.get("Players")
                if pid and name:
                    all_players[pid]["name"] = name
                    all_players[pid]["id"] = pid
                    all_players[pid]["link"] = f"/players/{pid}"
                    all_players[pid]["fielding"].append(row)

        except Exception as e:
            team_data["fielding"] = f"Error: {str(e)}"

    # Add TOT row for multi-team players
for pid, p in all_players.items():
        for section in ["batting", "pitching", "fielding"]:
            # Only count as multi-team if more than one distinct team
            teams = set(row.get("team") for row in p[section])
            if len(teams) > 1:
                p[section] = merge_totals(p[section])

    with open(os.path.join(output_folder, "players_combined.json"), "w") as f:
        json.dump(list(all_players.values()), f, indent=2)
    print("players_combined.json created.")

    # You can add your standings/schedule logic here if needed

if __name__ == "__main__":
    generate_stats_from_excel("data/SOM 1999 Full Season Replay.xlsm", "data/stats")
