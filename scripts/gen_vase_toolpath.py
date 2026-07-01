"""Generate a realistic fluted-vase toolpath JSON (Week 4 stand-in data).

This produces the SAME schema as grasshopper/export_toolpath.py, so the web UI,
RAPID generator, and sim all consume it identically. It stands in for a real
Grasshopper export until one is authored — the geometry is a non-planar-ish
fluted vase: a circular wall whose radius bulges at mid-height, with angular
flutes and a slight per-layer twist.

Run:  python3 scripts/gen_vase_toolpath.py
Out:  data/toolpaths/vase.json   (mm, world frame, Z-up)
"""
from __future__ import annotations

import json
import math
import os
import datetime

# ---- vase parameters (mm) ----
CX, CY = 1500.0, 0.0      # vase center in world XY (in front of the robot)
HEIGHT = 300.0            # total height
LAYER_H = 5.0             # layer height -> 60 layers
PTS_PER_LAYER = 72        # points around the loop (every 5 deg)
R_BASE = 130.0            # base radius
R_BULGE = 40.0            # extra radius at mid-height (the belly)
FLUTE_AMP = 0.06          # flute depth as fraction of radius
FLUTE_COUNT = 9           # number of vertical flutes
TWIST_PER_LAYER = 1.4     # degrees of twist added per layer
FEED_PRINT = 50.0         # mm/s
FEED_TRAVEL = 200.0       # mm/s
FLOW = 1.2                # mm^3/s while printing
APPROACH_Z = 200.0        # safe height for approach/retract

# Nozzle pointing straight down = 180 deg about world X.
# quaternion [qx, qy, qz, qw]
ORIENT_DOWN = [1.0, 0.0, 0.0, 0.0]


def radius_at(z: float) -> float:
    """Vase profile: bulge in the middle, pinch at top and bottom."""
    t = z / HEIGHT  # 0..1
    return R_BASE + R_BULGE * math.sin(math.pi * t)


def point(theta_deg: float, z: float) -> list[float]:
    theta = math.radians(theta_deg)
    r = radius_at(z) * (1.0 + FLUTE_AMP * math.cos(FLUTE_COUNT * theta))
    x = CX + r * math.cos(theta)
    y = CY + r * math.sin(theta)
    return [round(x, 3), round(y, 3), round(z, 3)] + ORIENT_DOWN


def build_doc() -> dict:
    n_layers = int(round(HEIGHT / LAYER_H))
    layers = []
    for li in range(n_layers):
        z = li * LAYER_H
        twist = li * TWIST_PER_LAYER
        moves = []

        # Layer 0 only: travel from a safe approach height down to the start.
        if li == 0:
            start = point(twist, z)
            moves.append({
                "type": "travel",
                "pose": [start[0], start[1], APPROACH_Z] + ORIENT_DOWN,
                "feed": FEED_TRAVEL,
                "extrude": 0.0,
            })

        # Print the loop (closed: include the wrap-back point).
        for i in range(PTS_PER_LAYER + 1):
            ang = twist + (360.0 * i / PTS_PER_LAYER)
            moves.append({
                "type": "print",
                "pose": point(ang, z),
                "feed": FEED_PRINT,
                "extrude": FLOW,
            })

        # Last layer: retract straight up.
        if li == n_layers - 1:
            last = point(twist + 360.0, z)
            moves.append({
                "type": "travel",
                "pose": [last[0], last[1], APPROACH_Z] + ORIENT_DOWN,
                "feed": FEED_TRAVEL,
                "extrude": 0.0,
            })

        layers.append({"id": li, "z_nominal": round(z, 3), "moves": moves})

    return {
        "version": "1.0",
        "units": "mm",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "source": {"tool": "gen_vase_toolpath.py", "file": "vase.json", "author": "shiny"},
        "robot": {
            "model": "ABB IRB 6700-175/3.05",
            "tcp_frame": "tool0",
            "base_frame": "world",
        },
        "tool": {
            "type": "extruder",
            "id": "pellet_extruder_v2",
            "offset": [0, 0, 250, 0, 0, 0, 1],
        },
        "layers": layers,
    }


def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(here, "..", "data", "toolpaths", "vase.json")
    out_path = os.path.normpath(out_path)
    doc = build_doc()
    with open(out_path, "w") as f:
        json.dump(doc, f, indent=2)
    n_moves = sum(len(L["moves"]) for L in doc["layers"])
    print(f"wrote {n_moves} moves across {len(doc['layers'])} layers -> {out_path}")


if __name__ == "__main__":
    main()
