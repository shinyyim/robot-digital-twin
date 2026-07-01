import * as THREE from 'three'

// ---- Toolpath JSON types (mirror of data/toolpaths/schema.md) ----

export type MoveType = 'travel' | 'print' | 'purge' | 'pause'

export interface Move {
  type: MoveType
  /** TCP pose in world frame: [x, y, z, qx, qy, qz, qw]. Position in `units`. */
  pose: [number, number, number, number, number, number, number]
  feed: number
  extrude: number
  dwell_ms?: number
}

export interface Layer {
  id: number
  z_nominal: number
  moves: Move[]
}

export interface Toolpath {
  version: string
  units: 'mm' | 'm'
  generated_at: string
  source: { tool: string; file: string; author: string }
  robot: { model: string; tcp_frame: string; base_frame: string }
  tool: { type: string; id: string; offset: number[] }
  layers: Layer[]
}

// ---- Frame / unit conversion boundary ----
// Toolpath JSON: millimeters, ABB world frame (Z-up).
// three.js scene:  meters, Y-up.
// This is the ONE place that conversion happens (see PLAN.md cross-cutting checklist).
//   scene_x =  world_x / 1000
//   scene_y =  world_z / 1000   (world Z-up  ->  three Y-up)
//   scene_z = -world_y / 1000
export function worldToScene(
  pose: Move['pose'],
  units: Toolpath['units'],
): THREE.Vector3 {
  const k = units === 'mm' ? 0.001 : 1
  const [x, y, z] = pose
  return new THREE.Vector3(x * k, z * k, -y * k)
}

// Quaternion for the Z-up (world) -> Y-up (scene) basis change: Rx(-90°).
const Q_ZUP_TO_YUP = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -Math.PI / 2,
)

/**
 * Convert a TCP pose's orientation (quaternion [qx,qy,qz,qw] in ABB world frame)
 * into the three.js scene frame, so an axes triad shows the real tool direction.
 * Same basis change as worldToScene() for positions.
 */
export function poseToSceneQuaternion(pose: Move['pose']): THREE.Quaternion {
  const [, , , qx, qy, qz, qw] = pose
  const q = new THREE.Quaternion(qx, qy, qz, qw)
  return Q_ZUP_TO_YUP.clone().multiply(q)
}

/** A contiguous run of moves of the same type, ready to draw as one line. */
export interface Segment {
  type: MoveType
  points: THREE.Vector3[]
  layerId: number
}

/**
 * Flatten layers -> drawable segments. Consecutive moves of the same type are
 * merged into one polyline so travel and print can be colored separately.
 */
export function toSegments(tp: Toolpath): Segment[] {
  const segments: Segment[] = []
  for (const layer of tp.layers) {
    let current: Segment | undefined
    let prev: THREE.Vector3 | undefined
    for (const move of layer.moves) {
      const p = worldToScene(move.pose, tp.units)
      if (current === undefined || current.type !== move.type) {
        // start a new segment, keeping continuity with the previous point
        current = { type: move.type, points: prev ? [prev, p] : [p], layerId: layer.id }
        segments.push(current)
      } else {
        current.points.push(p)
      }
      prev = p
    }
  }
  return segments
}

export const MOVE_COLORS: Record<MoveType, string> = {
  print: '#ffb547',  // amber
  travel: '#38d4ff', // cyan
  purge: '#ff7a59',
  pause: '#6f7c8e',
}

export function countMoves(tp: Toolpath): number {
  return tp.layers.reduce((n, l) => n + l.moves.length, 0)
}

/**
 * Validate that a parsed object looks like a Toolpath. Throws a human-readable
 * Error if not — so the UI can show what's wrong with an uploaded file.
 */
export function validateToolpath(obj: unknown): Toolpath {
  if (!obj || typeof obj !== 'object') throw new Error('Not a JSON object')
  const tp = obj as Partial<Toolpath>
  if (!Array.isArray(tp.layers)) throw new Error('Missing "layers" array')
  if (tp.units !== 'mm' && tp.units !== 'm') throw new Error('"units" must be "mm" or "m"')
  for (const [i, layer] of tp.layers.entries()) {
    if (!Array.isArray(layer.moves)) throw new Error(`Layer ${i}: missing "moves" array`)
    for (const [j, m] of layer.moves.entries()) {
      if (!Array.isArray(m.pose) || m.pose.length !== 7)
        throw new Error(`Layer ${i}, move ${j}: "pose" must be 7 numbers [x,y,z,qx,qy,qz,qw]`)
    }
  }
  return tp as Toolpath
}

/** Read a File (from a picker or drag-drop), parse + validate it as a Toolpath. */
export async function loadToolpathFile(file: File): Promise<Toolpath> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    throw new Error(`${file.name} is not valid JSON`)
  }
  return validateToolpath(parsed)
}
