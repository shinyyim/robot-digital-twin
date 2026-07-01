import { useRef, useState } from 'react'
import vaseToolpath from '@data/toolpaths/vase.json'
import Viewport from './scene/Viewport'
import type { RobotSample } from './scene/Robot'
import Header, { type Mode } from './panels/Header'
import LeftPanel from './panels/LeftPanel'
import RightPanel from './panels/RightPanel'
import Transport from './panels/Transport'
import { loadToolpathFile, type Toolpath } from './lib/toolpath'

export default function App() {
  const [mode, setMode] = useState<Mode>('CAM')
  const [activeLayer, setActiveLayer] = useState<number | null>(null)
  const [showTravel, setShowTravel] = useState(true)
  const [paused, setPaused] = useState(false)
  const [sample, setSample] = useState<RobotSample | null>(null)

  // Active toolpath — starts as the bundled vase, replaced by uploads.
  const [toolpath, setToolpath] = useState<Toolpath>(vaseToolpath as Toolpath)
  const [fileName, setFileName] = useState('vase.json')
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const totalLayers = toolpath.layers.length

  async function openFile(file: File) {
    try {
      const tp = await loadToolpathFile(file)
      setToolpath(tp)
      setFileName(file.name)
      setActiveLayer(null)
    } catch (e) {
      alert(`Could not load toolpath:\n${(e as Error).message}`)
    }
  }

  return (
    <div
      className="app"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) openFile(f)
      }}
    >
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) openFile(f)
          e.target.value = '' // allow re-selecting the same file
        }}
      />

      <Header mode={mode} onMode={setMode} model={toolpath.robot.model} />

      <main>
        <LeftPanel
          toolpath={toolpath}
          fileName={fileName}
          activeLayer={activeLayer}
          onLayer={setActiveLayer}
          showTravel={showTravel}
          onToggleTravel={setShowTravel}
          onOpenFile={() => fileInput.current?.click()}
        />

        <section className="viewport">
          <Viewport
            toolpath={toolpath}
            showTravel={showTravel}
            activeLayer={activeLayer}
            paused={paused}
            onSample={setSample}
          />

          <div className="overlay">
            <div className="axes-readout">
              <h4>TCP — scene frame</h4>
              <div className="axis-row">
                <span className="label">X</span>
                <span className="val">{(sample?.tcp.x ?? 0).toFixed(3)}</span>
                <span className="unit" style={{ color: 'var(--muted)' }}>m</span>
              </div>
              <div className="axis-row">
                <span className="label">Y</span>
                <span className="val">{(sample?.tcp.y ?? 0).toFixed(3)}</span>
                <span className="unit" style={{ color: 'var(--muted)' }}>m</span>
              </div>
              <div className="axis-row">
                <span className="label">Z</span>
                <span className="val">{(sample?.tcp.z ?? 0).toFixed(3)}</span>
                <span className="unit" style={{ color: 'var(--muted)' }}>m</span>
              </div>
              <div style={{ height: 6 }} />
              <div className="axis-row">
                <span className="label">Qx</span>
                <span className="val">{(sample?.quat.x ?? 0).toFixed(3)}</span>
                <span className="unit" style={{ color: 'var(--muted)' }} />
              </div>
              <div className="axis-row">
                <span className="label">Qy</span>
                <span className="val">{(sample?.quat.y ?? 0).toFixed(3)}</span>
                <span className="unit" style={{ color: 'var(--muted)' }} />
              </div>
              <div className="axis-row">
                <span className="label">Qz</span>
                <span className="val">{(sample?.quat.z ?? 0).toFixed(3)}</span>
                <span className="unit" style={{ color: 'var(--muted)' }} />
              </div>
              <div className="axis-row">
                <span className="label">Qw</span>
                <span className="val">{(sample?.quat.w ?? 1).toFixed(3)}</span>
                <span className="unit" style={{ color: 'var(--muted)' }} />
              </div>
            </div>

            <div className="layer-badge">
              {activeLayer == null ? (
                <>ALL LAYERS<span className="big mono">{totalLayers}</span></>
              ) : (
                <>LAYER<span className="big mono">{activeLayer}</span>/ {totalLayers}</>
              )}
            </div>

            <div className="legend">
              <div className="item">
                <span className="swatch" style={{ background: 'var(--print)' }} /> Print
              </div>
              <div className="item">
                <span className="swatch" style={{ background: 'var(--travel)' }} /> Travel
              </div>
              <div className="item" style={{ marginLeft: 12, color: 'var(--muted)' }}>
                grid: 100mm
              </div>
            </div>
          </div>
        </section>

        <RightPanel toolpath={toolpath} fileName={fileName} sample={sample} />
      </main>

      <Transport paused={paused} onTogglePlay={() => setPaused((p) => !p)} />

      {dragging && (
        <div className="drop-overlay">
          <div className="drop-card">Drop a toolpath .json to load it</div>
        </div>
      )}
    </div>
  )
}
