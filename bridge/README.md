# bridge/ — robot streaming bridge (PROTOTYPE)

Validates the reference **socket-streaming** control approach end-to-end, with no
real robot. The wire format is now matched to a common confirmed input format
(15-field CSV per move); only the line terminator and port are still assumed.

## Approach

The robot is driven by streaming one **15-field CSV line per move** over TCP
to a RAPID program on the controller, which parses each line into a robtarget +
digital outputs and runs `MoveL`.

Direction (decided): the **robot is the CLIENT** and dials the streaming PC, so
**our bridge is the SERVER** that listens; the robot (or the mock) connects in.

```
toolpath JSON ──► stream_toolpath.py ──TCP──► mock_streamin.py
 (data/toolpaths)   (SERVER, listens;         (CLIENT, dials in;
                     encodes 15-field lines)    parses CSV, "MoveL")
                          ▲
            later: the real controller dials this bridge's IP
```

## Wire format (confirmed against the reference format)

One move per line: **15 comma-separated fields**, newline-terminated.

```
targetX,targetY,targetZ,qx,qy,qz,qw,config1,config2,config3,config4,trackposition,velocity,D01,D02
```

| field            | format     | source / value                          |
|------------------|------------|-----------------------------------------|
| targetX,Y,Z      | `+0000.00` | toolpath pose x,y,z (mm, **signed**)    |
| qx,qy,qz,qw      | `+0.00`    | toolpath quaternion, **xyzw order** (signed) |
| config1..4       | `+0`       | `0,0,0,0` → robot runs `ConfL\Off`      |
| trackposition    | unsigned   | `0` (linear track unused)               |
| velocity         | unsigned   | toolpath feed (mm/s)                    |
| D01              | `1`/`0`    | extruder on/off (from `extrude`)        |
| D02              | `0`        | unused / off                            |

Sign rule: every numeric field is signed (+/-) **except** trackposition and
velocity. Quaternion is **xyzw** (w-last) — same order as the toolpath JSON, so
no reordering. Blend zone (z5, 5 mm) and any motion defaults live robot-side.

## Files

- `stream_protocol.py` — encode/decode one move as the 15-field CSV line.
- `stream_toolpath.py` — **server**; listens, waits for the robot, streams a toolpath JSON.
- `mock_streamin.py` — **client**; mimics the robot, dials in and parses/counts the `MoveL`s.
- `sniff.py` — capture + classify raw wire bytes (used to confirm the format).

## Verify locally

```bash
python3 bridge/stream_toolpath.py &      # terminal 1: server, waits
python3 bridge/mock_streamin.py          # terminal 2: client, dials in
```

Confirmed (2026-06-30): vase.json → 4382 moves over 60 layers streamed and parsed
1:1 as 15-field CSV; quaternion xyzw; config `+0,+0,+0,+0`; extruder D01 toggles.

## ⚠️ Still assumed — confirm before touching a real controller

Confirmed against the reference format: the 15 fields, formats (`+0000.00` / `+0.00`), xyzw
quaternion, sign rule (track + velocity unsigned), config `0,0,0,0` (+ `ConfL\Off`),
D01=extruder / D02=off, robot-dials-in (bridge = server), zone z5 robot-side.

**Still assumed** (safe defaults; change in one place when confirmed):
1. **Line terminator** — we use `"\n"`.
2. **TCP port** — default 5656 (also seen 1025); set the real one.
3. **trackposition / velocity field widths** — plain unsigned numbers.
4. **Quaternion precision** — 2 decimals (`+0.00`) is coarse; bump `QUAT_DEC` if needed.

Bind to the real controller IP and keep localhost-only until reviewed.
