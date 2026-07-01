# Robot Digital Twin — ABB IRB 6700-175/3.05

Digital twin and browser UI for a **robotic 3D-printing workcell** built on an ABB
IRB 6700-175/3.05 (175 kg payload, 3.05 m reach, IRC5 controller). A toolpath authored
in Grasshopper is rendered live on a web twin of the real arm, and — over the same file —
streamed to the controller. Eventually an LLM agent drives the whole surface.

## The core idea: one JSON is the contract

A **neutral toolpath JSON** (`data/toolpaths/`, schema in `data/toolpaths/schema.md`) is
the single source of truth. Geometry is authored once and every consumer reads the *same*
file — the web twin, the RAPID generator, the simulator, and the live bridge. Nothing
re-encodes the path.

- Units **mm**, frame **ABB world, Z-up**.
- Each move: `type` (travel / print / purge / pause), `pose = [x,y,z, qx,qy,qz,qw]` (position + quaternion), `feed` (mm/s), `extrude` (flow).
- Moves grouped into `layers` (id, z_nominal, moves[]).
- **No joint angles** — the JSON is TCP-space and robot-agnostic. IK happens downstream (RAPID generator / controller). Quaternions, not Euler — straight from Grasshopper Planes, no gimbal lock.

## Data flow

```
  AUTHORING (CAM)              CONTRACT                    CONSUMERS
 ┌─────────────────┐      ┌──────────────────┐   ✅  ┌──────────────────────┐
 │ Grasshopper     │      │ Neutral toolpath │──────▶│ Web twin (ui/)       │
 │ export_toolpath │─────▶│ JSON             │       │ React + R3F + URDF   │
 │ gen_vase (stand)│      │ data/toolpaths/  │   ⬜  ┌──────────────────────┐
 └─────────────────┘      │ mm · Z-up · quat │──────▶│ RAPID generator .mod │
                          └────────┬─────────┘       └──────────┬───────────┘
                                   │             ⬜  ┌──────────▼───────────┐
                                   └────────────────▶│ RobotStudio sim      │
                                                     └──────────────────────┘
                          🟡 socket streaming (TCP, 15-field CSV / move)
                          bridge/  ⇄  IRC5 controller  →  twin mirrors live state
```

## Stack

- **Robot:** ABB IRB 6700-175/3.05 · IRC5 controller · RobotStudio (Virtual Controller) as sim source of truth
- **Toolpath authoring:** Rhino + Grasshopper + custom Python (Plane → quaternion)
- **Web twin:** Vite + React + TypeScript + three + @react-three/fiber + drei + urdf-loader
- **Bridge:** Python socket-streaming prototype (see *Live control* below)

## Web twin (`ui/`)

Renders a real IRB 6700 (loaded from URDF) plus the toolpath, interactive.

```bash
cd ui && npm install && npm run dev      # Vite dev server
```

```
ui/src/
  App.tsx            state: active toolpath, mode, layer, play/pause, file upload
  lib/toolpath.ts    JSON types, validation, segment builder, FRAME conversion
  scene/  Viewport · Robot (urdf-loader, joint anim, TCP sample) · Toolpath · Workcell
  panels/ Header(modes) · LeftPanel(files/layers) · RightPanel(telemetry) · Transport
```

**Single conversion boundary** — three coordinate systems meet, converted in exactly one
place (`lib/toolpath.ts → worldToScene`): toolpath JSON (mm, Z-up) · URDF (m, Z-up) ·
three.js (m, Y-up). `worldToScene(x,y,z) = (x, z, -y) / 1000`; the robot group is rotated
−90° about X so arm and toolpath share one frame.

## Live control: socket streaming (not RWS/EGM)

The robot is driven by **real-time socket string streaming** (RobArch / COMPAS_RRC
family), not RWS/EGM — EGM is overkill and needs a paid license. Grasshopper streams one
**15-field CSV line per move** over TCP to a RAPID server module on the controller, which
parses each line into a robtarget + IO and runs `MoveL`.

`bridge/` is a working **prototype** validating this end-to-end with no real robot: the
robot is the **client** and dials in, so the bridge is the **server** that listens.

```
toolpath JSON ──▶ stream_toolpath.py (SERVER, encodes 15-field lines)
                        ⇅ TCP
                  mock_streamin.py (CLIENT, parses CSV → "MoveL")
```

RAPID `orient` is **w-first** `[w,x,y,z]`; our JSON is `[x,y,z,w]`, so the streamer /
RAPID generator reorders. Details: `bridge/README.md`, `docs/pipeline.md`.

## Design principle: tool surface as contract

Every UI capability is a thin wrapper over a tool with a JSON schema, so the same surface
later becomes the LLM agent's tool set (query / edit / action tiers) and is testable by
`curl`. Safety (joint limits, speed caps, dead-man, confirmation) is enforced server-side
in the bridge, never in the LLM.

## Directory layout

| Path | Purpose |
|---|---|
| `data/toolpaths/` | Neutral JSON toolpaths + `schema.md` (`vase.json`, `example.json`) |
| `data/robot/` · `data/workcell/` · `data/parts/` | Robot/URDF notes, workcell + part meshes (glTF, gitignored) |
| `grasshopper/` | `export_toolpath.py` — GH Python 3 toolpath exporter |
| `scripts/` | Standalone generators / converters (`gen_vase_toolpath.py`, `rhino_to_glb.py`) |
| `ui/` | React + Three.js web twin (URDF + toolpath); robot assets in `ui/public/robot/` |
| `bridge/` | Python socket-streaming prototype (server + mock client) |
| `robotstudio_3d/` | RobotStudio-exported `.glb` link meshes (accurate 175/3.05 variant) |
| `docs/` | `pipeline.md` (architecture), `PLAN.md` (roadmap), `robotstudio_export.md`, `syllabus.md` |
| `rapid/` | Generated `.mod` programs (gitignored) |
| `obsidian/` | Symlink to Obsidian project notes |

## Status (Week 4)

Legend: ✅ built · 🟡 placeholder (works, not final) · ⬜ planned

- ✅ Browser twin renders a real IRB 6700 + a real 60-layer / 4382-move vase toolpath, interactive; drag-drop loads any schema-valid JSON.
- ✅ Grasshopper exporter (`export_toolpath.py`) and stand-in generator (`gen_vase_toolpath.py`).
- ✅ Socket-streaming bridge prototype (`bridge/`) validated against a mock controller.
- 🟡 Robot is the open-source IRB 6700-**200/2.60** URDF — right structure; link lengths differ from 175/3.05 until the accurate URDF is filled from `robotstudio_3d/` meshes.
- 🟡 Toolpath is a generated vase, not yet a real Grasshopper part.
- ⬜ RAPID generator · RobotStudio sim hookup · live controller connection · LLM agent.

**Roadmap** (`docs/PLAN.md`): W5 colored tube geometry + layer filter · W6 scrubber + IK + deposition · W7 inspector + pre-flight · W8 RAPID generator · W9 socket bridge to controller · W10 LIVE mode · W11–12 record/replay + dashboard · W13–14 LLM agentic UI.

## More

Architecture deep-dive: `docs/pipeline.md`. Toolpath schema: `data/toolpaths/schema.md`.
Bridge protocol: `bridge/README.md`.
