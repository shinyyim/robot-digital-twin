export default function Transport({
  paused,
  onTogglePlay,
}: {
  paused: boolean
  onTogglePlay: () => void
}) {
  return (
    <footer>
      <div className="transport">
        <button className={`btn${!paused ? ' play' : ''}`} onClick={onTogglePlay} title="Play">
          ▶
        </button>
        <button className="btn" onClick={onTogglePlay} title="Pause">
          ⏸
        </button>
        <button className="btn stop" title="Stop">
          ■
        </button>
        <button className="btn estop" title="E-stop">
          !
        </button>
      </div>
      <div className="timeline">
        <div className="timeline-bar">
          <div className="timeline-fill" style={{ width: '0%' }} />
          <div className="timeline-marker" style={{ left: '0%' }} />
        </div>
        <div className="timeline-labels">
          <span className="mono">00:00</span>
          <span className="progress mono">
            {paused ? '⏸ paused' : '▶ live jog'} · placeholder timeline (scrubber → Week 6)
          </span>
          <span className="mono">--:--</span>
        </div>
      </div>
      <div className="footer-right">
        <div className="big mono">W2</div>
        <div>twin mockup</div>
      </div>
    </footer>
  )
}
