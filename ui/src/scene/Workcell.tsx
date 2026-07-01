import * as THREE from 'three'
import { useMemo } from 'react'

// Stylized workcell matching the real tent cell (reference photo). Layout:
//   - RAIL: grey beam the robot is mounted on (runs along Z), a bit low; the
//     real track is unused -> static here. Robot base sits on top at y=0.
//   - GAP between the rail and the build table.
//   - BUILD TABLE: long, low, flat slab in front (+X) — the print bed; flat top
//     at y=0 so the vase (base at scene y=0) sits on it.
// Robot base stays at the scene origin so toolpath coords are unaffected.

const RAIL_H = 0.65 // rail height (lowered); floor sits this far below the robot base
const FLOOR_Y = -RAIL_H
const GAP = 0.55 // clear gap between rail edge and build table inner edge

// Build-table top height (raised slightly above the robot base). Exported so the
// toolpath (vase) can be lifted by the same amount to stay sitting on the table.
export const BUILD_TOP_Y = 0.15

const mat = (c: number, r: number, m: number) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m })

export default function Workcell() {
  const mats = useMemo(
    () => ({
      rail: mat(0x333a43, 0.6, 0.5),
      railTop: mat(0x3e454e, 0.5, 0.55),
      steel: mat(0x363c44, 0.65, 0.45),
      // build-table top: neutral grey (no warm/brown tint), slightly brighter
      wood: new THREE.MeshStandardMaterial({ color: 0x646a73, roughness: 0.8, metalness: 0.15 }),
    }),
    [],
  )

  // Build table: long flat slab, rotated 90° so its length runs along Z.
  // Centered near the vase (x~1.5) with a gap from the rail.
  const railHalfX = 0.5
  const tableLen = 3.2 // long dimension (runs along Z after rotation)
  const tableW = 1.4 // short dimension (runs along X after rotation)
  const tableCx = railHalfX + GAP + tableW / 2 // center X, offset from the rail
  const topThick = 0.1

  return (
    <group>
      {/* lowered concrete floor + grid */}
      <gridHelper args={[16, 64, 0x3a4654, 0x232b34]} position={[0, FLOOR_Y + 0.002, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color={0x171d24} roughness={0.95} metalness={0.05} />
      </mesh>

      {/* RAIL — grey beam the robot is mounted on (along Z); top at y=0 */}
      <mesh position={[0, -RAIL_H / 2, 0]} material={mats.rail} castShadow receiveShadow>
        <boxGeometry args={[1.0, RAIL_H, 5.2]} />
      </mesh>
      <mesh position={[0, -0.02, 0]} material={mats.railTop} receiveShadow>
        <boxGeometry args={[1.0, 0.06, 5.2]} />
      </mesh>

      {/* BUILD TABLE — long, low, flat slab; rotated 90° so length runs along Z;
          top raised to BUILD_TOP_Y */}
      <group position={[tableCx, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, BUILD_TOP_Y - topThick / 2, 0]} material={mats.wood} castShadow receiveShadow>
          <boxGeometry args={[tableLen, topThick, tableW]} />
        </mesh>
        {/* leg rails under the slab (from floor up to the raised top) */}
        {[-tableLen / 2 + 0.2, 0, tableLen / 2 - 0.2].map((x, i) =>
          [-tableW / 2 + 0.15, tableW / 2 - 0.15].map((z, j) => (
            <mesh
              key={`${i}-${j}`}
              position={[x, (FLOOR_Y + BUILD_TOP_Y) / 2 - topThick / 2, z]}
              material={mats.steel}
              castShadow
            >
              <boxGeometry args={[0.07, BUILD_TOP_Y - FLOOR_Y, 0.07]} />
            </mesh>
          )),
        )}
      </group>
    </group>
  )
}
