import type { Toolpath } from '../lib/toolpath'

export default function LeftPanel({
  toolpath,
  fileName,
  activeLayer,
  onLayer,
  showTravel,
  onToggleTravel,
  onOpenFile,
}: {
  toolpath: Toolpath
  fileName: string
  activeLayer: number | null
  onLayer: (id: number | null) => void
  showTravel: boolean
  onToggleTravel: (v: boolean) => void
  onOpenFile: () => void
}) {
  return (
    <aside className="left">
      <div className="section">
        <h3>Toolpaths</h3>
        <div className="file-row active">
          <div className="icon" />
          <span>{fileName}</span>
          <span className="meta">{toolpath.layers.length}L</span>
        </div>
        <button className="load-btn" onClick={onOpenFile}>
          + Load toolpath .json
        </button>
        <div className="hint">…or drag a .json onto the window</div>
      </div>

      <div className="section">
        <h3>Layers — {fileName.replace(/\.json$/, '')}</h3>
        <div className="layers">
          <button
            className={`layer${activeLayer == null ? ' active' : ''}`}
            onClick={() => onLayer(null)}
          >
            <span className="idx mono">··</span>
            <span>all layers</span>
            <span className="moves mono">{toolpath.layers.length}</span>
          </button>
          {toolpath.layers.map((l) => (
            <button
              key={l.id}
              className={`layer${activeLayer === l.id ? ' active' : ''}`}
              onClick={() => onLayer(l.id)}
            >
              <span className="idx mono">{String(l.id).padStart(2, '0')}</span>
              <span>z = {l.z_nominal.toFixed(1)}mm</span>
              <span className="moves mono">{l.moves.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Display</h3>
        <label className="file-row" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showTravel}
            onChange={(e) => onToggleTravel(e.target.checked)}
          />
          <span>Show travel moves</span>
        </label>
      </div>

      <div className="section">
        <h3>Workcell</h3>
        <div className="file-row">
          <div className="icon" />
          <span>workcell.glb</span>
          <span className="meta">soon</span>
        </div>
        <div className="file-row">
          <div className="icon" />
          <span>print_bed.glb</span>
          <span className="meta">soon</span>
        </div>
      </div>
    </aside>
  )
}
