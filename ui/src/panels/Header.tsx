export type Mode = 'CAM' | 'LIVE' | 'VIZ'

const MODES: Mode[] = ['CAM', 'LIVE', 'VIZ']

export default function Header({
  mode,
  onMode,
  model,
}: {
  mode: Mode
  onMode: (m: Mode) => void
  model: string
}) {
  return (
    <header>
      <div className="brand">
        ROBOT&nbsp;DIGITAL&nbsp;TWIN<span className="sub">/ workcell_01</span>
      </div>
      <div className="modes">
        {MODES.map((m) => (
          <button key={m} className={`mode${m === mode ? ' active' : ''}`} onClick={() => onMode(m)}>
            {m}
          </button>
        ))}
      </div>
      <div className="header-right">
        <span className="pill">
          <span className="dot" /> ONLINE
        </span>
        <span className="robot-id mono">{model}</span>
        <span className="mono" style={{ color: 'var(--muted)' }}>
          S/N 6700-123124
        </span>
      </div>
    </header>
  )
}
