import pandas as pd
import json

def generate_schedule_from_excel(excel_path, output_path):
    xls = pd.ExcelFile(excel_path)
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

    with open(output_path, "w") as f:
        json.dump(schedule, f, indent=2)