import { JOINT_LIMITS, JOINT_NAMES, type RobotSample } from '../scene/Robot'
import type { Toolpath } from '../lib/toolpath'

export default function RightPanel({
  toolpath,
  fileName,
  sample,
}: {
  toolpath: Toolpath
  fileName: string
  sample: RobotSample | null
}) {
  const joints = sample?.joints ?? new Array(6).fill(0)
  const totalMoves = toolpath.layers.reduce((n, l) => n + l.moves.length, 0)

  return (
    <aside className="right">
      <div className="section">
        <h3>Program</h3>
        <div className="program-row">
          <span className="k">File</span>
          <span className="v">{fileName.replace(/\.json$/, '.mod')}</span>
        </div>
        <div className="program-row">
          <span className="k">Layers</span>
          <span className="v">{toolpath.layers.length}</span>
        </div>
        <div className="program-row">
          <span className="k">Moves</span>
          <span className="v">{totalMoves}</span>
        </div>
        <div className="program-row">
          <span className="k">Tool</span>
          <span className="v">{toolpath.tool.id}</span>
        </div>
      </div>

      <div className="section">
        <h3>Extruder</h3>
        <div className="telemetry-grid">
          <div className="tile accent">
            <div className="label">Temp</div>
            <div className="value">
              215<span className="unit">°C</span>
            </div>
          </div>
          <div className="tile">
            <div className="label">Flow</div>
            <div className="value">
              1.20<span className="unit">mm³/s</span>
            </div>
          </div>
          <div className="tile">
            <div className="label">Feed</div>
            <div className="value">
              50<span className="unit">mm/s</span>
            </div>
          </div>
          <div className="tile ok">
            <div className="label">Pressure</div>
            <div className="value">
              42<span className="unit">bar</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <h3>Joint state</h3>
        <div>
          {JOINT_NAMES.map((name, i) => {
            const a = joints[i]
            const limit = JOINT_LIMITS[i]
            const pct = Math.min(Math.abs(a) / limit, 1) * 50
            return (
              <div className="joint-row" key={name}>
                <span className="name">{name}</span>
                <span className="val">{a.toFixed(2)}°</span>
                <div className="joint-bar">
                  <div
                    className="fill"
                    style={{
                      left: '50%',
                      width: `${pct}%`,
                      transform: a < 0 ? 'translateX(-100%)' : 'none',
                    }}
                  />
                </div>
                <span className="lim">±{limit}°</span>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
