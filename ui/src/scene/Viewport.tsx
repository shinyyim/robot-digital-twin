import { Canvas } from '@react-three/fiber'
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import Robot, { type RobotSample } from './Robot'
import ToolpathView from './Toolpath'
import Workcell, { BUILD_TOP_Y } from './Workcell'
import type { Toolpath } from '../lib/toolpath'

function Lights() {
  return (
    <>
      <ambientLight color={0x8a98a8} intensity={0.85} />
      <hemisphereLight color={0xcdd8e4} groundColor={0x3a3f44} intensity={0.7} />
      <directionalLight
        color={0xfff0d8}
        intensity={1.7}
        position={[4, 6, 3]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight color={0x9fd8ff} intensity={0.7} position={[-3, 3, -2]} />
    </>
  )
}

export default function Viewport({
  toolpath,
  showTravel,
  activeLayer,
  paused,
  onSample,
}: {
  toolpath: Toolpath
  showTravel: boolean
  activeLayer: number | null
  paused: boolean
  onSample: (s: RobotSample) => void
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 45, near: 0.05, far: 100, position: [4.8, 3.2, 4.8] }}
      onCreated={({ scene, camera }) => {
        scene.background = new THREE.Color(0x1b232d)
        scene.fog = new THREE.Fog(0x1b232d, 14, 30)
        camera.lookAt(0, 1, 0)
      }}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <Lights />
      {/* rotate the whole cell (robot + workcell + toolpath) 180° about vertical;
          they share one frame so they rotate together and stay aligned */}
      <group rotation={[0, Math.PI, 0]}>
        <Workcell />
        <Robot onSample={onSample} paused={paused} />
        {/* lift the toolpath so the part sits on the raised build-table top */}
        <group position={[0, BUILD_TOP_Y, 0]}>
          <ToolpathView
            data={toolpath}
            showTravel={showTravel}
            activeLayer={activeLayer}
            showFrames={false}
          />
        </group>
      </group>
      <OrbitControls
        target={[0, 1, 0]}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.5}
        maxDistance={18}
      />
      <GizmoHelper alignment="bottom-right" margin={[64, 88]}>
        <GizmoViewport axisColors={['#f24b5e', '#5bd585', '#38d4ff']} labelColor="#d8e0eb" />
      </GizmoHelper>
    </Canvas>
  )
}
