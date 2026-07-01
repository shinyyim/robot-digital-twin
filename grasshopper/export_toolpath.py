"""Grasshopper Python (3) component — export a toolpath as JSON.

Drop this into a GH Python 3 Script component. Inputs are wired from the GH canvas.

Inputs (right-click each on the component and set the access type):
    planes       (list, Plane)  — TCP frames in world coordinates, one per move
    extrude      (list, float)  — flow rate per move (mm^3/s); 0 = travel
    feed         (list, float)  — mm/s per move
    layer_id     (list, int)    — layer index per move
    move_type    (list, str)    — "travel" / "print" / "purge" / "pause"
    out_path     (str)          — file path to write JSON
    write        (bool)         — set True to actually write the file

Outputs:
    info         (str)          — status / path written / error
"""
from __future__ import annotations

import json
import datetime
import math


def plane_to_pose(plane):
    """Rhino Plane -> [x, y, z, qx, qy, qz, qw] in mm."""
    o = plane.Origin
    x_axis = plane.XAxis
    y_axis = plane.YAxis
    z_axis = plane.ZAxis

    m = [
        [x_axis.X, y_axis.X, z_axis.X],
        [x_axis.Y, y_axis.Y, z_axis.Y],
        [x_axis.Z, y_axis.Z, z_axis.Z],
    ]
    trace = m[0][0] + m[1][1] + m[2][2]
    if trace > 0:
        s = 0.5 / math.sqrt(trace + 1.0)
        qw = 0.25 / s
        qx = (m[2][1] - m[1][2]) * s
        qy = (m[0][2] - m[2][0]) * s
        qz = (m[1][0] - m[0][1]) * s
    elif m[0][0] > m[1][1] and m[0][0] > m[2][2]:
        s = 2.0 * math.sqrt(1.0 + m[0][0] - m[1][1] - m[2][2])
        qw = (m[2][1] - m[1][2]) / s
        qx = 0.25 * s
        qy = (m[0][1] + m[1][0]) / s
        qz = (m[0][2] + m[2][0]) / s
    elif m[1][1] > m[2][2]:
        s = 2.0 * math.sqrt(1.0 + m[1][1] - m[0][0] - m[2][2])
        qw = (m[0][2] - m[2][0]) / s
        qx = (m[0][1] + m[1][0]) / s
        qy = 0.25 * s
        qz = (m[1][2] + m[2][1]) / s
    else:
        s = 2.0 * math.sqrt(1.0 + m[2][2] - m[0][0] - m[1][1])
        qw = (m[1][0] - m[0][1]) / s
        qx = (m[0][2] + m[2][0]) / s
        qy = (m[1][2] + m[2][1]) / s
        qz = 0.25 * s

    return [o.X, o.Y, o.Z, qx, qy, qz, qw]


def build_doc(planes, extrude, feed, layer_id, move_type):
    n = len(planes)
    if not (len(extrude) == len(feed) == len(layer_id) == len(move_type) == n):
        raise ValueError("all input lists must have the same length")

    layers: dict[int, list[dict]] = {}
    for i in range(n):
        lid = int(layer_id[i])
        layers.setdefault(lid, []).append({
            "type": str(move_type[i]),
            "pose": plane_to_pose(planes[i]),
            "feed": float(feed[i]),
            "extrude": float(extrude[i]),
        })

    return {
        "version": "1.0",
        "units": "mm",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "source": {"tool": "grasshopper", "file": "", "author": ""},
        "robot": {
            "model": "ABB IRB 6700-175/3.05",
            "tcp_frame": "tool0",
            "base_frame": "world",
        },
        "tool": {
            "type": "extruder",
            "id": "",
            "offset": [0, 0, 0, 0, 0, 0, 1],
        },
        "layers": [
            {"id": lid, "z_nominal": layers[lid][0]["pose"][2], "moves": layers[lid]}
            for lid in sorted(layers)
        ],
    }


if write and out_path and planes:
    try:
        doc = build_doc(planes, extrude, feed, layer_id, move_type)
        with open(out_path, "w") as f:
            json.dump(doc, f, indent=2)
        info = f"wrote {sum(len(L['moves']) for L in doc['layers'])} moves across {len(doc['layers'])} layers to {out_path}"
    except Exception as e:
        info = f"error: {e}"
else:
    info = "set write=True and provide out_path + planes to export"
