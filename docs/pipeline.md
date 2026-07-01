# Pipeline & Architecture — Robot Digital Twin (current state)

Status snapshot as of Week 4. Legend: ✅ built · 🟡 placeholder (works, not final) · ⬜ planned.

## One-line summary

A **neutral JSON toolpath** is the contract. It is authored in Grasshopper,
consumed by a browser **digital twin** (React + Three.js) that renders an
**ABB IRB 6700** loaded from a **URDF**. Later the same JSON feeds a RAPID
generator and a live bridge to the real robot, and finally an LLM agent.

## Data-flow diagram (current)

```
   AUTHORING                     CONTRACT                 CONSUMERS
 ┌───────────────┐         ┌───────────────────┐
 │ Grasshopper   │  ✅     │  Neutral JSON      │   ✅  ┌────────────────────┐
 │ export_       │────────▶│  toolpath schema   │──────▶│ Web UI / twin (ui/)│
 │ toolpath.py   │         │  data/toolpaths/   │       │ React+R3F+Three.js │
 └───────────────┘         │  *.json            │       │  + URDF robot      │
 ┌───────────────┐  ✅     │  (mm, world Z-up,  │       └────────────────────┘
 │ gen_vase_     │────────▶│   TCP pose =       │   ⬜  ┌────────────────────┐
 │ toolpath.py   │         │   [x y z qx qy qz  │──────▶│ RAPID generator    │
 │ (stand-in)    │         │    qw], per layer) │       │ bridge/ → .mod     │
 └───────────────┘         └───────────────────┘       └────────────────────┘
                                     │              ⬜  ┌────────────────────┐
                                     └─────────────────▶│ RobotStudio sim    │
                                                        └────────────────────┘

   ROBOT MODEL                                    LIVE / AGENT (planned)
 ┌─────────────────────────┐  🟡        ⬜ ┌──────────────────────────────────┐
 │ URDF + meshes           │            │ bridge/ (FastAPI + WS)            │
 │ ui/public/robot/        │────────────│  RWS/EGM ↔ real IRC5 controller   │
 │  irb6700_200_260 (now)  │  loaded by │  → twin mirrors live joint state  │
 │  175_305/ (accurate,    │  urdf-     │                                   │
 │   pending prof. meshes) │  loader    │ LLM agentic tool surface          │
 └─────────────────────────┘            └──────────────────────────────────┘
```

## The contract: neutral toolpath JSON

`data/toolpaths/schema.md` defines it. Key idea — **one source, many consumers**:
the UI, the RAPID generator, and the sim all read the *same* file, so geometry
is authored once and never re-encoded.

- Units: **mm**. Frame: **ABB world, Z-up**.
- Each move: `type` (travel/print/purge/pause), `pose = [x,y,z, qx,qy,qz,qw]`
  (position + quaternion), `feed` (mm/s), `extrude` (flow).
- Grouped into `layers` (id, z_nominal, moves[]).
- Quaternions (not Euler) — easy from Grasshopper Planes, no gimbal lock.
- **No joint angles** in the JSON — it is TCP-space and robot-agnostic. IK
  happens downstream (in the RAPID generator / controller).

## Authoring side (CAM)

- ✅ `grasshopper/export_toolpath.py` — Grasshopper Python 3 component. Takes
  TCP Planes + per-move feed/extrude/layer/type, converts Plane→quaternion,
  writes the JSON.
- ✅ `scripts/gen_vase_toolpath.py` — standalone generator (same schema) used as
  Week-4 stand-in data: a 60-layer fluted vase → `data/toolpaths/vase.json`.
- ⬜ `scripts/rhino_to_glb.py` — `.3dm` → `.glb` for the workcell/part meshes.

## Robot model

- 🟡 `ui/public/robot/irb6700_200_260.urdf` — open-source ros-industrial URDF
  (IRB 6700-**200/2.60**) + 9 visual STL meshes. Real geometry, drives the twin now.
- 🟡 `ui/public/robot/175_305/irb6700_175_305.urdf` — scaffold for the **accurate**
  variant. Already has the real 175/3.05 joint limits + speeds; joint origins
  (link lengths) and meshes are TODO. Filled from the RobotStudio-exported `.glb` meshes
  (exported assembled, so link lengths are derived from mesh positions) — see
  `docs/robotstudio_export.md`.
- urdf-loader reads the URDF; a `loadMeshCb` handles STL / GLB / glTF / DAE.

## Web UI / digital twin (`ui/`)

Stack: **Vite + React + TypeScript + three + @react-three/fiber + @react-three/drei
+ urdf-loader.** Run: `cd ui && npm install && npm run dev`.

```
ui/src/
  App.tsx              app state: active toolpath, mode, layer, play/pause; file upload
  lib/toolpath.ts      JSON types, validation, segment-builder, FRAME CONVERSION
  scene/
    Viewport.tsx       R3F Canvas: lights, grid/floor, OrbitControls, gizmo
    Robot.tsx          loads URDF via urdf-loader, animates joints, samples TCP
    Toolpath.tsx       draws moves as colored lines (print=amber, travel=cyan)
  panels/              Header(modes) · LeftPanel(files/layers) · RightPanel
                       (telemetry/joints) · Transport(play/timeline)
```

## The single conversion boundary (important)

Three coordinate systems meet; the conversion lives in **one place**
(`lib/toolpath.ts` → `worldToScene`):

| Stage | Units | Up axis | Notes |
|---|---|---|---|
| Toolpath JSON | mm | Z-up | ABB world |
| URDF | m | Z-up | ROS convention |
| three.js scene | m | Y-up | render space |

`worldToScene(x,y,z) = (x, z, -y) / 1000`. The robot group is rotated −90° about
X so the URDF (Z-up) lands in the scene (Y-up) — the *same* mapping — so robot
and toolpath share one frame. (For the future RAPID generator: ABB `orient` is
quaternion **w-first** `[w,x,y,z]`; our JSON is `[x,y,z,w]` — that generator
swaps order.)

## Live control: socket streaming (streaming method)

The reference workflow drives the robot by **real-time socket string streaming** (RobArch /
COMPAS_RRC family), not RWS/EGM. Grasshopper sends `position + quaternion + speed
+ IO` strings over **TCP port 5656** to a RAPID server module (`streamIN`) on the
controller: `SocketReceive` → `StrToVal` → `MoveL`. So the Phase-3 bridge should
**speak a socket-streaming protocol** rather than build RWS/EGM from scratch
(EGM is overkill + needs a paid license).

**Open / verify later:** whether to use the official open-source `compas_rrc`
library or match the reference *custom* protocol. The reference was `RobArch-style` with
a hand-rolled `streamIN` — RobArch predates compas_rrc (2019), so the wire
format may differ. Re-confirm against the reference Grasshopper streaming
definition + `streamIN` RAPID module before committing. A local prototype
(`bridge/`) validates the approach end-to-end in the meantime.

Quaternion convention: RAPID `orient` is **w-first** `[q1=w, q2, q3, q4]`; our
toolpath JSON is `[x,y,z,w]`, so the streamer / RAPID generator reorders to
`[w,x,y,z]`.

## Design principle: tool surface as contract

Every UI capability is meant to be a thin wrapper over a tool with a JSON schema.
The same surface later becomes the LLM agent's tool set (query / edit / action
tiers), so the UI is testable by `curl` and the agent gets exactly what the user
has. Safety (joint limits, speed caps, dead-man, confirmation) is enforced
server-side in the bridge, never in the LLM.

## What is real vs not, today

- ✅ Browser twin renders a real IRB 6700 + a real 60-layer toolpath, interactive.
- 🟡 Robot is the open-source 200/2.60 variant (looks/structure right; link
  lengths differ from 175/3.05 until the accurate URDF is filled).
- 🟡 Toolpath is a generated vase, not yet a real Grasshopper part.
- ⬜ No connection to a real/simulated controller yet (RAPID gen, RWS/EGM bridge).
- ⬜ No LLM agent yet.

## Next milestones (per docs/PLAN.md)

W5 colored tube geometry + layer filter · W6 scrubber + IK + deposition growth ·
W7 inspector + pre-flight checks · W8 RAPID generator · W9 RWS bridge ·
W10 LIVE mode · W11–12 record/replay + dashboard · W13–14 LLM agentic UI.
