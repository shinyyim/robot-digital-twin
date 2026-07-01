# Toolpath JSON schema

This is the **neutral format** between Grasshopper and everything downstream
(RAPID generator, web UI, sim). One source, many consumers.

## Top-level shape

```json
{
  "version": "1.0",
  "units": "mm",
  "generated_at": "2026-05-19T15:32:00Z",
  "source": {
    "tool": "grasshopper",
    "file": "vase_v3.gh",
    "author": "shiny"
  },
  "robot": {
    "model": "ABB IRB 6700-175/3.05",
    "tcp_frame": "tool0",
    "base_frame": "world"
  },
  "tool": {
    "type": "extruder",
    "id": "pellet_extruder_v2",
    "offset": [0, 0, 250, 0, 0, 0, 1]
  },
  "layers": [
    {
      "id": 0,
      "z_nominal": 0.0,
      "moves": [
        {
          "type": "travel",
          "pose": [1500.0, 0.0, 50.0, 0.0, 0.0, 0.0, 1.0],
          "feed": 200.0,
          "extrude": 0.0
        },
        {
          "type": "print",
          "pose": [1500.0, 200.0, 50.0, 0.0, 0.0, 0.0, 1.0],
          "feed": 50.0,
          "extrude": 1.2
        }
      ]
    }
  ]
}
```

## Fields

### Move

| Field | Type | Meaning |
|---|---|---|
| `type` | `"travel" \| "print" \| "purge" \| "pause"` | What the robot is doing. Drives UI coloring and RAPID generation. |
| `pose` | `[x, y, z, qx, qy, qz, qw]` | TCP pose in world frame. Position in `units`, orientation as quaternion. |
| `feed` | float | mm/s. Drives `MoveL v…` in RAPID. |
| `extrude` | float | Material flow rate, units = mm³/s (or pellets-RPM if discrete). 0 for travel. |
| `dwell_ms` | int? | Optional pause-in-place duration. Only on `"pause"` moves. |

### Layer

| Field | Type | Meaning |
|---|---|---|
| `id` | int | Monotonic layer index from base. |
| `z_nominal` | float | Approximate layer height in world frame. Used for the scrubber's "show up to layer N" view. May not match actual TCP Z for non-planar prints. |
| `moves` | Move[] | Ordered list of moves in this layer. |

## Why quaternions instead of Euler

Grasshopper Planes are easy to convert to quaternions, and quaternions don't
suffer gimbal lock when the print head is tilted past 90°. RAPID's `MoveL`
uses ABB `orient` (also a quaternion: `[q1, q2, q3, q4]` = `[w, x, y, z]`) —
note the **w-first** ordering. The generator must swap conventions.

## Why no joint angles

The toolpath is TCP-space. Inverse kinematics happens **inside** the RAPID
generator (or in the controller via `MoveL`), not here. This keeps the JSON
robot-agnostic and lets the UI render the path before knowing which arm runs it.
