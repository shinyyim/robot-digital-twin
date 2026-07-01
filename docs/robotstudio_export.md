# Accurate URDF workflow — IRB 6700-175/3.05 from RobotStudio

Building a URDF that matches the real arm's kinematics within a millimeter.
This is the "accurate" path — it takes a couple of hours but gives a twin you
can trust against RobotStudio's Virtual Controller and against the real robot.

## What you need

- RobotStudio (any recent version)
- ABB product manual for IRB 6700 (document **3HAC044266-001**, freely
  downloadable from ABB Library) — contains the official DH parameters,
  joint limits, and link lengths for all 6700 variants
- A way to convert SAT/STEP → glTF (FreeCAD or Rhino both work)
- A text editor

## Step 1 — Load the exact variant in RobotStudio

1. New Solution → empty station.
2. ABB Library → Robot → **IRB 6700** → select variant **`IRB 6700-175/3.05`**.
3. Confirm the workspace shows the arm in its zero pose with axis indicators visible.

## Step 2 — Export per-link geometry

Each robot link needs its own mesh, positioned in its own frame.

1. In the **Layout** browser, expand the robot. You'll see `Link 1`, `Link 2`,
   ... up to `Link 6` plus the base.
2. For each link:
   - Right-click the link → **Modify Mechanism** is **not** the right path.
     Instead, right-click → **Export Geometry** (or **Modeling tab → Export
     CAD Geometry** with the link selected).
   - Save as `.sat` or `.stp` into `data/robot/meshes/source/link_N.sat`.
3. Note the **link frame** RobotStudio places each part in. ABB exports each
   link in its **own joint-fixed frame** (i.e. as if all upstream joints were
   at zero). This matches URDF convention — good.

## Step 3 — Convert meshes to glTF

In FreeCAD:

1. Open each `.sat` / `.stp`.
2. Switch to the **Mesh Design** workbench.
3. **Meshes → Create mesh from shape** (use a 0.5 mm tolerance for visual,
   2 mm for collision).
4. **File → Export** as **glTF Binary (.glb)** into:
   - `data/robot/meshes/visual/link_N.glb`
   - `data/robot/meshes/collision/link_N.stl` (use convex hull for collision)

Or in Rhino: import the `.sat`, mesh it, export `.glb` via `_Export` (Rhino 8+
has native glTF export).

## Step 4 — Get DH parameters from the product manual

Open ABB document **3HAC044266-001** and find the section for the 175/3.05
variant. You need:

| Parameter | What it is |
|---|---|
| `a_i` | Link length along joint i's X-axis |
| `alpha_i` | Twist angle around joint i's X-axis |
| `d_i` | Link offset along joint i's Z-axis |
| `theta_offset_i` | Zero-position offset for joint i |
| `q_min_i`, `q_max_i` | Joint limits |
| `qd_max_i` | Max joint speed |

For the 6700-175/3.05 specifically the dominant numbers are (verify against
the actual datasheet — these are typical 6700 numbers, not the exact variant):

- Reach: 3050 mm
- Joint 1: ±170°, 100°/s
- Joint 2: −65° to +85°, 90°/s
- Joint 3: −180° to +70°, 90°/s
- Joint 4: ±300°, 170°/s
- Joint 5: ±130°, 170°/s
- Joint 6: ±360°, 220°/s

## Step 5 — Write the URDF

**Scaffold already exists** in this repo:
`ui/public/robot/175_305/irb6700_175_305.urdf`. It was seeded from the
open-source **200/2.60** variant (the closest one ABB publishes openly — the
docs originally guessed 150/3.20, but 200/2.60 is what's in the repo) and
already has the **real 175/3.05 joint limits + speeds** filled in. You only
need to substitute:

- Replace each `<mesh filename="..."/>` with your exported `.glb` (put them in
  `ui/public/robot/175_305/visual/` and point filenames at `visual/link_N.glb`).
- Replace the `<origin xyz="..."/>` marked `TODO` on each joint with the
  DH-derived transform from the manual. **This is the accuracy-critical part** —
  the TCP match depends on these, not on the meshes.
- `<limit>` values are already correct (datasheet 175/3.05) — leave them.

The accurate URDF lives at `ui/public/robot/175_305/irb6700_175_305.urdf`
(not `data/robot/` — the web app serves meshes from `ui/public/`). When it's
filled, flip one line in `ui/src/scene/Robot.tsx`:

```ts
const URDF_URL = '/robot/175_305/irb6700_175_305.urdf'
```

### Priority: kinematics first, meshes second

The meshes are **visual only**. An accurate TCP needs only the correct joint
`<origin>` transforms. So the fast path to an accurate twin is:
1. Fill the 6 joint `<origin xyz>` from the manual DH table (keep 200/2.60
   meshes as stand-ins) → TCP is already correct, arm just looks slightly off
   at the joints.
2. Later, export + drop in the real meshes for visual fidelity.

## Step 6 — Validate against RobotStudio

The whole point of the accurate path is that **FK(your URDF, q) ==
FK(RobotStudio, q)** for any joint vector `q`.

1. In RobotStudio, jog the robot to a known pose (e.g. all joints at 0; then
   `[0, 30°, -30°, 0, 90°, 0]`; then random poses).
2. Read the TCP pose from RobotStudio (Modify → Robot at Position → shows
   target value).
3. In Python, load your URDF with `urdfpy` (or `yourdfpy`), compute FK at the
   same joint values, compare TCP.
4. Error should be < 1 mm. If it's > 5 mm, a DH parameter is wrong — check
   `d` and `a` against the manual; a single transposed number is the
   usual culprit.

## Step 7 — Bake in this arm's calibration

The resolver values on this physical robot's nameplate (`6700-123124`) are
small offsets that compensate for manufacturing tolerances. Add them as
`<joint>` origin offsets or as a `joint_offsets` section so the twin matches
THIS arm, not the ideal CAD arm. See `data/robot/README.md` for the
recorded values from the nameplate.
