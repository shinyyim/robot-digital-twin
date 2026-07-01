import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js'
// @ts-ignore - urdf-loader ships partial types; default export is the loader class
import URDFLoader from 'urdf-loader'

export interface RobotSample {
  joints: number[] // degrees, J1..J6
  tcp: THREE.Vector3 // scene-space position of tool0
  quat: THREE.Quaternion // scene-space orientation of tool0
}

// IRB 6700-175/3.05 joint limits (deg), from the URDF — used by the panel bars.
export const JOINT_NAMES = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6']
export const JOINT_LIMITS = [170, 85, 180, 300, 130, 360]

// Accurate 175/3.05 variant (the real workcell robot). Kinematics from ABB
// product spec 3HAC044265-001 Rev.Z; real per-link glTF meshes exported from
// RobotStudio (link-local offset baked into vertices, glTF Y-up matrix stripped).
const URDF_URL = '/robot/175_305/irb6700_175_305.urdf'
const JOINT_IDS = ['joint_1', 'joint_2', 'joint_3', 'joint_4', 'joint_5', 'joint_6']

// Yaw (rad) about vertical so the robot faces the build table (+X). Negative = CW from above.
const ROBOT_YAW = 0

// Rest pose + gentle jog range (deg) so the arm feels "live", within limits.
const JOG = [
  { base: 12, range: 18 },
  { base: 22, range: 14 },
  { base: -18, range: 12 },
  { base: 0, range: 40 },
  { base: 45, range: 20 },
  { base: -30, range: 60 },
]

const ABB_GREY = new THREE.MeshStandardMaterial({
  color: 0xdfe3e8,
  roughness: 0.5,
  metalness: 0.45,
})

/**
 * IRB 6700 arm loaded from the ros-industrial URDF via urdf-loader.
 * URDF is meters + Z-up (ROS); the scene is meters + Y-up, so the robot group
 * is rotated -90° about X — which matches lib/toolpath.ts worldToScene exactly.
 */
export default function Robot({
  onSample,
  paused = false,
}: {
  onSample?: (s: RobotSample) => void
  paused?: boolean
}) {
  const [robot, setRobot] = useState<THREE.Object3D | null>(null)
  const frame = useRef(0)
  const tcpWorld = useRef(new THREE.Vector3())
  const tcpQuat = useRef(new THREE.Quaternion())

  // Load the URDF once.
  useEffect(() => {
    const manager = new THREE.LoadingManager()
    const loader = new URDFLoader(manager)
    // Dispatch by extension so RobotStudio exports work as STL, GLB/glTF, or DAE.
    loader.loadMeshCb = (
      path: string,
      _manager: THREE.LoadingManager,
      done: (obj: THREE.Object3D, err?: Error) => void,
    ) => {
      const ext = path.split('?')[0].split('.').pop()?.toLowerCase()
      const fail = (err: unknown) => done(new THREE.Object3D(), err as Error)
      if (ext === 'stl') {
        new STLLoader().load(
          path,
          (geom: THREE.BufferGeometry) => {
            geom.computeVertexNormals()
            done(new THREE.Mesh(geom, ABB_GREY))
          },
          undefined,
          fail,
        )
      } else if (ext === 'glb' || ext === 'gltf') {
        new GLTFLoader().load(path, (gltf) => done(gltf.scene), undefined, fail)
      } else if (ext === 'dae') {
        new ColladaLoader().load(path, (dae) => done(dae.scene), undefined, fail)
      } else {
        fail(new Error(`Unsupported mesh format: ${ext}`))
      }
    }
    let alive = true
    loader.load(URDF_URL, (result: THREE.Object3D) => {
      if (!alive) return
      result.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh) {
          m.castShadow = true
          m.receiveShadow = true
        }
      })
      setRobot(result)
    })
    return () => {
      alive = false
    }
  }, [])

  // Cache the tool0 link object for TCP readout.
  const tool0 = useMemo(() => {
    if (!robot) return null
    let found: THREE.Object3D | null = null
    robot.traverse((o) => {
      if (o.name === 'tool0') found = o
    })
    return found
  }, [robot])

  useFrame(({ clock }) => {
    if (!robot) return
    const s = paused ? 1.7 : clock.getElapsedTime()
    const angles = JOG.map((j, i) => j.base + Math.sin(s * 0.5 + i) * j.range)

    const r = robot as any
    JOINT_IDS.forEach((id, i) => {
      r.setJointValue?.(id, THREE.MathUtils.degToRad(angles[i]))
    })

    frame.current++
    if (onSample && frame.current % 5 === 0) {
      if (tool0) {
        ;(tool0 as THREE.Object3D).getWorldPosition(tcpWorld.current)
        ;(tool0 as THREE.Object3D).getWorldQuaternion(tcpQuat.current)
      }
      onSample({ joints: angles, tcp: tcpWorld.current.clone(), quat: tcpQuat.current.clone() })
    }
  })

  if (!robot) return null
  // Outer group: yaw about the vertical (scene Y) so the robot faces the build
  // table (+X). Negative = clockwise viewed from above.
  // Inner: Z-up (URDF) -> Y-up (scene), same mapping as worldToScene().
  return (
    <group rotation={[0, ROBOT_YAW, 0]}>
      <primitive object={robot} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  )
}
