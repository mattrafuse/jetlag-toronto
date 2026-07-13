import csv
import json
import os
from collections import defaultdict
from pathlib import Path


def load_trip_names(trips_path: Path) -> dict[str, str]:
    """
    Read trips.txt and return a mapping of shape_id -> friendly route name.
    Prioritises trip_headsign, then trip_short_name, then route_id.
    """
    shape_names: dict[str, str] = {}
    try:
        with trips_path.open("r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                sid = row.get("shape_id", "").strip()
                if not sid:
                    continue
                name = (
                    row.get("trip_headsign", "")
                    or row.get("trip_short_name", "")
                    or row.get("route_id", "")
                ).strip()
                # Prefer the first (earliest) non-empty name we see
                if sid not in shape_names and name:
                    shape_names[sid] = name
    except FileNotFoundError:
        print(f"  (no trips.txt found at {trips_path}, skipping route names)")
    return shape_names


def convert_shapes_to_geojson(input_csv: Path, output_dir="geojson_output"):
    # Create the output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    # Group points by shape_id
    # Structure: { shape_id: [ { 'lat': lat, 'lon': lon, 'seq': seq }, ... ] }
    shapes_data = defaultdict(list)

    print("Reading and parsing shapes.txt...")
    try:
        with input_csv.open("r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)

            # Quick validation of expected GTFS columns
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

    # Load friendly route names from the sibling trips.txt
    trips_path = input_csv.parent / "trips.txt"
    shape_names = load_trip_names(trips_path)

    # Write each shape to an individual GeoJSON file
    for shape_id, points in shapes_data.items():
        # 1. Sort points by their sequence order
        sorted_points = sorted(points, key=lambda x: x["seq"])

        # 2. Extract coordinates in [Longitude, Latitude] format for GeoJSON compliance
        coordinates = [[pt["lon"], pt["lat"]] for pt in sorted_points]

        # 3. Look up friendly name
        friendly_name = shape_names.get(shape_id, "")

        # 4. Construct GeoJSON structure
        geojson_structure = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "shape_id": shape_id,
                        "name": friendly_name,
                        "point_count": len(coordinates),
                    },
                    "geometry": {"type": "LineString", "coordinates": coordinates},
                }
            ],
        }

        # Sanitizing shape_id for safe filenames
        safe_filename = "".join(
            [c for c in shape_id if c.isalpha() or c.isdigit() or c in (" ", "_", "-")]
        ).rstrip()
        output_filepath = os.path.join(output_dir, f"{safe_filename}.geojson")

        # 5. Save file
        with open(output_filepath, "w", encoding="utf-8") as out_file:
            json.dump(geojson_structure, out_file, indent=2)

    print(f"Success! All GeoJSON files saved to the '{output_dir}' directory.")


if __name__ == "__main__":
    for entry in Path(__file__).parent.rglob("**/shapes.txt"):
        convert_shapes_to_geojson(entry)
