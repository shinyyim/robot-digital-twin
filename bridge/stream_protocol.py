"""Socket-streaming wire protocol — matched to a common actual input format.

One move per line, 15 comma-separated fields (confirmed against the reference format):

  targetX,targetY,targetZ,qx,qy,qz,qw,config1,config2,config3,config4,trackposition,velocity,D01,D02

Field formats (confirmed):
  - position X,Y,Z         : signed, +0000.00   (sign + 4 int + 2 dec, mm)
  - quaternion qx,qy,qz,qw : signed, +0.00      (sign + 1 int + 2 dec; xyzw order)
  - config1..4             : signed int, +0     (sent as 0,0,0,0 -> robot runs ConfL\\Off)
  - trackposition          : UNSIGNED           (linear track unused -> 0)
  - velocity               : UNSIGNED  (mm/s)
  - D01                    : 1/0  (extruder on/off)
  - D02                    : 0    (unused / off)

Sign rule (confirmed): every numeric field carries an explicit +/- EXCEPT
trackposition and velocity, which are unsigned.

Direction (decided): robot is the CLIENT, this bridge is the SERVER.

STILL ASSUMED (safe defaults; confirm against the reference format, change in one place):
  - line terminator = "\\n"
  - TCP port (set in stream_toolpath.py / mock_streamin.py)
  - trackposition / velocity field widths (we send plain unsigned numbers)
  - quaternion at 2 decimals is coarse (~0.5 deg); bump QUAT_DEC if needed.
"""
from __future__ import annotations

from dataclasses import dataclass, field

QUAT_DEC = 2          # quaternion decimals (stream format = +0.00)
TERMINATOR = "\n"     # end-of-message marker
DEFAULT_CONFIG = (0, 0, 0, 0)   # ConfL\Off on the robot side
DEFAULT_TRACK = 0.0             # linear track unused


@dataclass
class Move:
    pos_mm: tuple[float, float, float]
    quat_xyzw: tuple[float, float, float, float]   # x, y, z, w  (wire order)
    velocity: float                                # mm/s
    d01: int                                       # extruder on/off
    d02: int = 0
    config: tuple[int, int, int, int] = field(default=DEFAULT_CONFIG)
    track: float = DEFAULT_TRACK


def encode_move(
    pos_mm: tuple[float, float, float],
    quat_xyzw: tuple[float, float, float, float],
    velocity: float,
    extrude: float,
    config: tuple[int, int, int, int] = DEFAULT_CONFIG,
    track: float = DEFAULT_TRACK,
) -> bytes:
    """Toolpath move -> one 15-field line (newline-terminated)."""
    x, y, z = pos_mm
    qx, qy, qz, qw = quat_xyzw
    d01 = 1 if extrude > 0 else 0

    fields = [
        f"{x:+08.2f}", f"{y:+08.2f}", f"{z:+08.2f}",          # position (signed)
        f"{qx:+0{3 + QUAT_DEC}.{QUAT_DEC}f}",                 # quaternion (signed)
        f"{qy:+0{3 + QUAT_DEC}.{QUAT_DEC}f}",
        f"{qz:+0{3 + QUAT_DEC}.{QUAT_DEC}f}",
        f"{qw:+0{3 + QUAT_DEC}.{QUAT_DEC}f}",
        f"{config[0]:+d}", f"{config[1]:+d}",                 # config (signed int)
        f"{config[2]:+d}", f"{config[3]:+d}",
        f"{track:.2f}",                                       # track (UNSIGNED)
        f"{velocity:.2f}",                                    # velocity (UNSIGNED)
        str(d01), str(d02_off()),                             # D01 extruder, D02 off
    ]
    return (",".join(fields) + TERMINATOR).encode("ascii")


def d02_off() -> int:
    return 0


def decode_move(line: str) -> Move:
    """Parse one 15-field line back into a Move (what the robot's parser does)."""
    p = line.strip().split(",")
    if len(p) != 15:
        raise ValueError(f"expected 15 fields, got {len(p)}: {line!r}")
    return Move(
        pos_mm=(float(p[0]), float(p[1]), float(p[2])),
        quat_xyzw=(float(p[3]), float(p[4]), float(p[5]), float(p[6])),
        config=(int(float(p[7])), int(float(p[8])), int(float(p[9])), int(float(p[10]))),
        track=float(p[11]),
        velocity=float(p[12]),
        d01=int(p[13]),
        d02=int(p[14]),
    )
