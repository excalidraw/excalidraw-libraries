from apiclient.discovery import build
from datetime import date
from datetime import timedelta
from oauth2client.service_account import ServiceAccountCredentials
import os
import json


SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]
VIEW_ID = "208661610"

THRESSHOLD = 10

ROOT_DIR = os.path.dirname(os.path.realpath(__file__))
STATS_DIR = os.path.join(ROOT_DIR, "stats")
KEY_FILE = os.path.join(ROOT_DIR, "excalidraw-key.json")

MAP = {
    "Android": "g-script-android",
    "Apple Devices Frames": "franky47-apple-devices-frames",
    "Charts": "g-script-charts",
    "Data Viz": "dbssticky-DataViz",
    "Dropdowns": "h7y-dropdowns",
    "Forms": "g-script-forms",
    "Gadgets": "morgemoensch-gadgets",
    "Hearts": "dwelle-hearts",
    "Information Architecture": "inwardmovement-information-architecture",
    "IT Logos": "pclainchard-it-logos",
    "Medias": "g-script-medias",
    "Polygons": "lipis-polygons",
    "RaspberryPI": "revolunet-raspberrypi3",
    "Software Architecture": "youritjang-software-architecture",
    "Stars": "lipis-stars",
    "Stick figures": "youritjang-stick-figures",
    "Stick Figures": "youritjang-stick-figures",
}


def initialize_analyticsreporting():
    credentials = ServiceAccountCredentials.from_json_keyfile_name(KEY_FILE, SCOPES)
    return build("analyticsreporting", "v4", credentials=credentials)


def get_library_report(analytics, day="yesterday"):
    return (
        analytics.reports()
        .batchGet(
            body={
                "reportRequests": [
                    {
                        "viewId": VIEW_ID,
                        "dateRanges": [{"startDate": day, "endDate": day}],
                        "metrics": [{"expression": "ga:totalEvents"}],
                        "dimensions": [
                            {"name": "ga:eventCategory"},
                            {"name": "ga:eventAction"},
                            {"name": "ga:eventLabel"},
                        ],
                    }
                ]
            }
        )
        .execute()
    )


def print_library_response(response):
    counts = {}
    for report in response.get("reports", []):
        for row in report.get("data", {}).get("rows", []):
            dimensions = row.get("dimensions", [])
            metrics = row.get("metrics", [])
            if not (
                dimensions[0] == "library"
                and dimensions[1] in ["download", "import"]
                and dimensions[2] != "(not set)"
            ):
                continue

            label = dimensions[2]
            label = label if label not in MAP else MAP[label]
            value = int(metrics[0]["values"][0])
            if label in counts:
                counts[label] += value
            else:
                counts[label] = value
        for download in counts:
            print(download, ":", counts[download])
    return counts


def main():
    if not os.path.exists(KEY_FILE):
        print("Key file not found", KEY_FILE)
        return

    today = date.today()

    # Set current date to 2020-12-11 to count all visits from the beginning:
    current_date = date(2020, 12, 11)
    stats = {}
    analytics = initialize_analyticsreporting()
    total_downloads = 0
    total_downloads_day = 0
    total_downloads_week = 0

    while current_date <= today:
        day = current_date.strftime("%Y-%m-%d")
        # Load data from JSON if it's older than N days
        if current_date < today + timedelta(days=-2):
            libraries_file = os.path.join(STATS_DIR, day + ".json")
            with open(libraries_file, "r") as day_totals:
                libraries = json.load(day_totals)
        else:
            print()
            print(day)
            print("-" * 40)
            response = get_library_report(analytics, day)
            libraries = print_library_response(response)
            print()

        for library in libraries:
            total = libraries[library]
            total_downloads += total
            if library in stats:
                stats[library]["total"] += total
            else:
                stats[library] = {"total": total, "week": 0}
            if current_date > today + timedelta(days=-7):
                total_downloads_week += total
                stats[library]["week"] += total
            if current_date == today:
                total_downloads_day += total
        if libraries:
            with open(os.path.join(STATS_DIR, day + ".json"), "w") as outfile:
                json.dump(libraries, outfile, indent=2)
        if stats:
            with open(os.path.join(ROOT_DIR, "stats.json"), "w") as outfile:
                json.dump(stats, outfile, indent=2)
            with open(os.path.join(ROOT_DIR, "total.json"), "w") as outfile:
                json.dump(
                    {
                        "total": total_downloads,
                        "week": total_downloads_week,
                        "day": total_downloads_day,
                    },
                    outfile,
                    indent=2,
                )
        current_date += timedelta(days=1)


if __name__ == "__main__":
    main()
