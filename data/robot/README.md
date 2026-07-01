# Robot model — ABB IRB 6700-175/3.05

This folder holds the kinematic + visual description of the arm used by the web UI and any ROS-based sim.

## What goes here

```
data/robot/
├── irb6700_175_305.urdf          # the URDF (hand-written, accurate)
├── meshes/
│   ├── visual/                   # detailed glTF/STL for rendering
│   │   ├── base_link.glb
│   │   ├── link_1.glb
│   │   ├── ... link_6.glb
│   │   └── tool0.glb
│   └── collision/                # simplified hulls for collision checks
│       └── *.stl
└── calibration/
    └── resolver_zero.json        # per-axis resolver offsets (from nameplate)
```

## How to obtain the URDF

Follow `docs/robotstudio_export.md` — the accurate workflow exports per-link
meshes from RobotStudio and builds the URDF against ABB's published DH
parameters for the IRB 6700-175/3.05.

## Resolver calibration (from this specific arm's nameplate)

Serial: `6700-123124` (mfg 2020-02-14)

| Axis | Resolver value |
|---|---|
| 1 | 6.1494 |
| 2 | 1.3689 |
| 3 | 2.1095 |
| 4 | _TBD_ |
| 5 | _TBD_ |
| 6 | _TBD_ |

These are absolute-accuracy zero references for this physical robot. The twin
must use these when comparing live joint angles against commanded poses,
otherwise simulated and real TCP will diverge by a few millimeters.
