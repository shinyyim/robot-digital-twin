import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import {
  MOVE_COLORS,
  poseToSceneQuaternion,
  toSegments,
  worldToScene,
  type Toolpath,
} from '../lib/toolpath'

/**
 * Renders a toolpath as colored polylines: print=amber, travel=cyan.
 * Optionally hides travel moves, and dims layers above `activeLayer`.
 * (Week 5 upgrades this to TubeGeometry / LineSegments2 for real volume.)
 */
export default function ToolpathView({
  data,
  showTravel = true,
  activeLayer,
  showFrames = true,
}: {
  data: Toolpath
  showTravel?: boolean
  activeLayer?: number | null
  showFrames?: boolean
}) {
  const segments = useMemo(() => toSegments(data), [data])

  // One TCP orientation triad (xyz axes) per layer, oriented by the pose quaternion.
  const frames = useMemo(() => {
    return data.layers
      .map((layer) => {
        const m = layer.moves.find((mv) => mv.type === 'print') ?? layer.moves[0]
        if (!m) return null
        const p = worldToScene(m.pose, data.units)
        const q = poseToSceneQuaternion(m.pose)
        return {
          pos: [p.x, p.y, p.z] as [number, number, number],
          quat: [q.x, q.y, q.z, q.w] as [number, number, number, number],
        }
      })
      .filter((f): f is { pos: [number, number, number]; quat: [number, number, number, number] } => f != null)
  }, [data])

  return (
    <group>
      {showFrames &&
        frames.map((f, i) => (
          <group key={`f${i}`} position={f.pos} quaternion={f.quat}>
            <axesHelper args={[0.12]} />
          </group>
        ))}
      {segments.map((seg, i) => {
        if (seg.type === 'travel' && !showTravel) return null
        if (seg.points.length < 2) return null
        const ahead = activeLayer != null && seg.layerId > activeLayer
        return (
          <Line
            key={i}
            points={seg.points.map((p) => [p.x, p.y, p.z]) as [number, number, number][]}
            color={MOVE_COLORS[seg.type]}
            lineWidth={seg.type === 'print' ? 2.5 : 1}
            transparent
            opacity={ahead ? 0.18 : seg.type === 'travel' ? 0.5 : 0.95}
            dashed={seg.type === 'travel'}
            dashSize={0.02}
            gapSize={0.012}
          />
        )
      })}
    </group>
  )
}
