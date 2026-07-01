"""Convert a Rhino .3dm file to .glb for use in the web viewer.

Usage:
    python scripts/rhino_to_glb.py input.3dm output.glb

Requires:
    pip install rhino3dm trimesh numpy

Notes:
    - Reads all mesh and brep objects from the .3dm file.
    - Breps are meshed using their render meshes (must exist in the file).
      If a brep has no render mesh, save the .3dm with shaded display and
      re-export, or convert breps to meshes in Rhino first.
    - Layer names are preserved as node names in the glTF scene.
    - Units are converted to meters in the output (.glb convention).
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import rhino3dm
import trimesh


RHINO_UNIT_TO_METERS = {
    rhino3dm.UnitSystem.Millimeters: 0.001,
    rhino3dm.UnitSystem.Centimeters: 0.01,
    rhino3dm.UnitSystem.Meters: 1.0,
    rhino3dm.UnitSystem.Inches: 0.0254,
    rhino3dm.UnitSystem.Feet: 0.3048,
}


def rhino_mesh_to_trimesh(rmesh: rhino3dm.Mesh, scale: float) -> trimesh.Trimesh | None:
    if rmesh is None or rmesh.Vertices.Count == 0:
        return None
    verts = np.array([[v.X, v.Y, v.Z] for v in rmesh.Vertices]) * scale
    faces: list[list[int]] = []
    for i in range(rmesh.Faces.Count):
        f = rmesh.Faces[i]
        faces.append([f[0], f[1], f[2]])
        if f[2] != f[3]:
            faces.append([f[0], f[2], f[3]])
    return trimesh.Trimesh(vertices=verts, faces=np.array(faces), process=False)


def convert(in_path: Path, out_path: Path) -> None:
    model = rhino3dm.File3dm.Read(str(in_path))
    if model is None:
        raise SystemExit(f"could not read {in_path}")

    scale = RHINO_UNIT_TO_METERS.get(model.Settings.ModelUnitSystem, 1.0)
    layers = {layer.Index: layer.Name for layer in model.Layers}
    scene = trimesh.Scene()

    for idx, obj in enumerate(model.Objects):
        geom = obj.Geometry
        attrs = obj.Attributes
        name = attrs.Name or f"{layers.get(attrs.LayerIndex, 'obj')}_{idx}"

        meshes: list[trimesh.Trimesh] = []
        if isinstance(geom, rhino3dm.Mesh):
            m = rhino_mesh_to_trimesh(geom, scale)
            if m is not None:
                meshes.append(m)
        elif isinstance(geom, (rhino3dm.Brep, rhino3dm.Extrusion)):
            for face in geom.Faces:
                rmesh = face.GetMesh(rhino3dm.MeshType.Any)
                m = rhino_mesh_to_trimesh(rmesh, scale)
                if m is not None:
                    meshes.append(m)

        if meshes:
            combined = trimesh.util.concatenate(meshes)
            scene.add_geometry(combined, node_name=name)

    if not scene.geometry:
        raise SystemExit("no convertible geometry found")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    scene.export(out_path)
    print(f"wrote {out_path} ({len(scene.geometry)} parts, units = meters)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: rhino_to_glb.py input.3dm output.glb")
    convert(Path(sys.argv[1]), Path(sys.argv[2]))
