import csv
import json
import os
from collections import defaultdict
from pathlib import Path


def load_train_route_ids(routes_path: Path) -> set[str]:
    """Read routes.txt and return the set of route_ids where route_type == 2 (train)."""
    train_routes: set[str] = set()
    try:
        with routes_path.open("r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("route_type", "").strip() == "2":
                    rid = row.get("route_id", "").strip()
                    if rid:
                        train_routes.add(rid)
    except FileNotFoundError:
        print(f"  (no routes.txt found at {routes_path}, skipping train filter)")
    return train_routes


def load_trip_data(
    trips_path: Path, train_routes: set[str]
) -> tuple[dict[str, str], set[str], dict[str, str]]:
    """
    Read trips.txt and return:
      - shape_names:   shape_id -> friendly route name
      - train_trip_ids: set of trip_ids belonging to train routes
      - trip_to_shape:  trip_id -> shape_id (for train trips only)
    """
    shape_names: dict[str, str] = {}
    train_trip_ids: set[str] = set()
    trip_to_shape: dict[str, str] = {}

    try:
        with trips_path.open("r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                sid = row.get("shape_id", "").strip()
                route_id = row.get("route_id", "").strip()
                trip_id = row.get("trip_id", "").strip()
                if not sid or not route_id or not trip_id:
                    continue
                if route_id not in train_routes:
                    continue
                train_trip_ids.add(trip_id)
                trip_to_shape[trip_id] = sid
                name = (
                    row.get("trip_headsign", "")
                    or row.get("trip_short_name", "")
                    or route_id
                ).strip()
                if sid not in shape_names and name:
                    shape_names[sid] = name
    except FileNotFoundError:
        print(f"  (no trips.txt found at {trips_path}, skipping route names)")

    return shape_names, train_trip_ids, trip_to_shape


def load_shape_stops(
    stop_times_path: Path, trip_to_shape: dict[str, str], train_trip_ids: set[str]
) -> dict[str, set[str]]:
    """
    Read stop_times.txt and return a mapping of shape_id -> set of stop_ids.
    Only processes rows whose trip_id belongs to a train route.
    """
    shape_stops: dict[str, set[str]] = defaultdict(set)

    try:
        with stop_times_path.open("r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                trip_id = row.get("trip_id", "").strip()
                stop_id = row.get("stop_id", "").strip()
                if not trip_id or not stop_id:
                    continue
                if trip_id not in train_trip_ids:
                    continue
                shape_id = trip_to_shape.get(trip_id)
                if shape_id:
                    shape_stops[shape_id].add(stop_id)
    except FileNotFoundError:
        print(f"  (no stop_times.txt found at {stop_times_path}, skipping stops)")

    return shape_stops


def load_stop_data(stops_path: Path) -> dict[str, dict]:
    """
    Read stops.txt and return a dict of stop_id -> {name, lat, lon}.
    """
    stop_data: dict[str, dict] = {}

    try:
        with stops_path.open("r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                stop_id = row.get("stop_id", "").strip()
                if not stop_id:
                    continue
                try:
                    lat = float(row.get("stop_lat", "").strip())
                    lon = float(row.get("stop_lon", "").strip())
                except (ValueError, TypeError):
                    continue
                stop_data[stop_id] = {
                    "name": row.get("stop_name", "").strip(),
                    "lat": lat,
                    "lon": lon,
                }
    except FileNotFoundError:
        print(f"  (no stops.txt found at {stops_path}, skipping stop coordinates)")

    return stop_data


def convert_shapes_to_geojson(
    input_csv: Path, output_dir: Path = Path("geojson_output")
):
    # Create the output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    # Group points by shape_id
    shapes_data = defaultdict(list)

    print("Reading and parsing shapes.txt...")
    try:
        with input_csv.open("r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)

            required_cols = {
                "shape_id",
                "shape_pt_lat",
                "shape_pt_lon",
                "shape_pt_sequence",
            }
            if not reader.fieldnames or not required_cols.issubset(reader.fieldnames):
                missing = required_cols - set(reader.fieldnames or [])
                raise ValueError(f"Missing required columns in CSV: {missing}")

            for row in reader:
                shape_id = row["shape_id"]
                shapes_data[shape_id].append(
                    {
                        "lat": float(row["shape_pt_lat"]),
                        "lon": float(row["shape_pt_lon"]),
                        "seq": int(row["shape_pt_sequence"]),
                    }
                )
    except FileNotFoundError:
        print(f"Error: Could not find '{input_csv}' in the current directory.")
        return

    print(f"Found {len(shapes_data)} unique shapes. Generating GeoJSON files...")

    # Load train route IDs from the sibling routes.txt
    routes_path = input_csv.parent / "routes.txt"
    train_routes = load_train_route_ids(routes_path)

    # Load trip data (names, trip IDs, trip-to-shape mapping)
    trips_path = input_csv.parent / "trips.txt"
    shape_names, train_trip_ids, trip_to_shape = load_trip_data(
        trips_path, train_routes
    )

    # Filter shapes to only those referenced by train trips
    if train_routes:
        shapes_data = defaultdict(
            list,
            {sid: pts for sid, pts in shapes_data.items() if sid in shape_names},
        )
        print(f"Filtered to {len(shapes_data)} train-only shapes.")

    # Load stop coordinates from the sibling stops.txt
    stops_path = input_csv.parent / "stops.txt"
    stop_data = load_stop_data(stops_path)

    # Load which stops belong to each shape (via stop_times.txt)
    stop_times_path = input_csv.parent / "stop_times.txt"
    shape_stops = load_shape_stops(stop_times_path, trip_to_shape, train_trip_ids)

    # Deduplicate by friendly name — keep the shape with the most points
    name_to_shape: dict[str, str] = {}
    name_point_counts: dict[str, int] = {}
    for shape_id, points in shapes_data.items():
        friendly_name = shape_names.get(shape_id, "")
        if not friendly_name:
            continue
        count = len(points)
        if friendly_name not in name_point_counts or count > name_point_counts[friendly_name]:
            name_point_counts[friendly_name] = count
            name_to_shape[friendly_name] = shape_id

    # Write each shape to an individual GeoJSON file
    for friendly_name, shape_id in name_to_shape.items():
        points = shapes_data[shape_id]

        # 1. Sort points by their sequence order
        sorted_points = sorted(points, key=lambda x: x["seq"])

        # 2. Extract coordinates in [Longitude, Latitude] format for GeoJSON compliance
        line_coordinates = [[pt["lon"], pt["lat"]] for pt in sorted_points]

        # 3. Build features — start with the line geometry
        features = [
            {
                "type": "Feature",
                "properties": {
                    "shape_id": shape_id,
                    "name": friendly_name,
                    "point_count": len(line_coordinates),
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": line_coordinates,
                },
            }
        ]

        # 4. Add station stop points for this shape
        station_stops = shape_stops.get(shape_id, set())
        for stop_id in station_stops:
            stop_info = stop_data.get(stop_id)
            if stop_info:
                features.append(
                    {
                        "type": "Feature",
                        "properties": {
                            "stop_id": stop_id,
                            "route_name": friendly_name,
                            "name": stop_info["name"],
                            "marker_symbol": "station",
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [stop_info["lon"], stop_info["lat"]],
                        },
                    }
                )

        # 5. Construct GeoJSON structure
        geojson_structure = {
            "type": "FeatureCollection",
            "features": features,
        }

        # Sanitizing friendly_name for safe filenames
        safe_filename = "".join(
            [c for c in friendly_name if c.isalpha() or c.isdigit() or c in (" ", "_", "-")]
        ).rstrip()
        output_filepath = os.path.join(output_dir, f"{safe_filename}.geojson")

        # 6. Save file
        with open(output_filepath, "w", encoding="utf-8") as out_file:
            json.dump(geojson_structure, out_file, indent=2)

    print(f"Success! All GeoJSON files saved to the '{output_dir}' directory.")


if __name__ == "__main__":
    for entry in Path(__file__).parent.rglob("**/shapes.txt"):
        convert_shapes_to_geojson(
            entry, Path(__file__).parent.parent / "shapes" / "metrolinx"
        )
