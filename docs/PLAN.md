# 14-Week Building Plan — Robot Digital Twin → LLM-Agentic Control

**Start:** 2026-05-19 (Tue, weekly seminar) · **End target:** 2026-08-18 (~14 weeks)
**Owner:** shiny
**North star:** A browser-based digital twin for an ABB IRB 6700-175/3.05 robotic 3D printing workcell, ending in an **LLM-driven agentic UI** that controls the robot through natural language — query the twin, propose motions, run programs, debug prints, all via chat with the twin as the substrate.

---

## Reframing

The plan begins with a research week (W1), then puts a working twin in the browser by end of Week 2 — even if it's a placeholder mockup. Every subsequent week makes that twin more real, until in the final phase it can be commanded by an LLM agent.

The twin is the **through-line**, not the destination. The destination is an agent that uses the twin to control the robot.

---

## Phase map

| Phase | Weeks | Theme | Demoable artifact at end |
|---|---|---|---|
| **1. Research & Foundation** | 1–4 | Research → mockup → accurate URDF → real toolpath | Browser twin shows real URDF + workcell + real toolpath JSON |
| **2. Twin Speaks** | 5–7 | Toolpath authoring + scrubber + inspector + pre-flight | Drag scrubber → robot poses → deposition grows |
| **3. Twin Talks to the Machine** | 8–10 | RAPID gen + RWS bridge + LIVE mode | Real robot moves → twin mirrors in <100 ms |
| **4. Twin Remembers** | 11–12 | Recording + REPLAY + deposition viz + dashboard | A real print is captured, replayed, analyzed |
| **5. Twin Listens** | 13–14 | LLM agentic UI for robot control | Natural-language commands move the robot safely |

Total: 4 + 3 + 3 + 2 + 2 = 14 weeks. Phases 4 and 5 are intentionally compressed so the agentic phase stays a sharp endpoint, not a victory lap.

---

## Phase 1 — Research & Foundation (Weeks 1–4)

### Week 1 · Research (Tue May 19)
- **Goal:** Survey the landscape and lock in design positions before writing code.
- **Tasks:** Read references: ETH DFAB, ICD Stuttgart, MX3D MetalXL, AI Build, COMPAS_RRC. Survey agentic-UI patterns: Claude tool-use, Cursor, Open Interpreter. ABB IRB 6700 documentation review (manual 3HAC044266-001). RobotStudio walkthrough.
- **Deliverable:** **Research Brief** (~1500 words) comparing three robotic AM toolchains and three agentic interfaces, with explicit positions on what to adopt or reject.
- **Done when:** Research brief committed to `obsidian/references/` and discussed in the Week 2 session.

### Week 2 · Twin Mockup (Tue May 26)
- **Goal:** A browser scene with a placeholder robot and a fake toolpath — the twin already exists at end of Week 2, even if everything is placeholder.
- **Tasks:** Scaffold `ui/` with Vite + React + TypeScript + `three`, `@react-three/fiber`, `@react-three/drei`, `urdf-loader`. Use a placeholder URDF (ros-industrial IRB 6700-150/3.20). Render the example toolpath JSON. Establish layout from `ui/mockup.html`: viewport, layer list, telemetry panel, mode banner, transport.
- **Done when:** `npm run dev` opens a moving 6-axis arm with a visible toolpath in the layout from the mockup.
- **Risk:** Toolchain pain (Vite + three + urdf-loader interop). Mitigation: start from a known-good template, change one thing at a time.

### Week 3 · Twin Accurate (Tue June 2)
- **Goal:** Replace the placeholder URDF with a RobotStudio-validated one for the actual IRB 6700-175/3.05.
- **Tasks:** Steps 1–6 of `docs/robotstudio_export.md`. FK validation against RobotStudio at 5 random joint vectors, error <1 mm.
- **Done when:** The same scene now shows the *real* arm with correct link lengths and joint limits. Visual diff vs RobotStudio at 5 poses.
- **Risk:** DH typo. Mitigation: compare each joint frame separately, not just TCP.

### Week 4 · Twin Grounded (Tue June 9)
- **Goal:** Real workcell, real toolpath.
- **Tasks:** `.3dm` → `.glb` for workcell + part (use `scripts/rhino_to_glb.py`). Grasshopper Python exporter producing real `data/toolpaths/*.json`. Load all three into the scene.
- **Done when:** Open browser → see real IRB 6700 + real workcell + a real Grasshopper-authored toolpath.
- **Risk:** Quaternion sign flips on Plane→quaternion conversion. Mitigation: spot-check 5 moves visually.

**Phase 1 demo (W4 pin-up):** "This is what the twin looks like with real data." Open the browser. Done.

---

## Phase 2 — Twin Speaks (Weeks 5–7)

### Week 5 · Toolpath rendering (Tue June 16)
- **Goal:** Toolpath visible as colored geometry, not just a polyline.
- **Tasks:** `TubeGeometry` per move (color by `type`: print=amber, travel=cyan). Switch to `LineSegments2` above 5k moves. Layer filter checkboxes.
- **Done when:** A 240-layer toolpath renders smoothly, filtering travel hides ~30% of segments.

### Week 6 · Scrubber + IK + deposition (Tue June 23)
- **Goal:** Drag a slider → robot moves → bead grows.
- **Tasks:** Time-based scrubber (move-index). Pose URDF via IK (closed-form for 6700 or interpolated joint angles if exporter adds them). Deposited tube = subarray of moves up to scrub index.
- **Done when:** Scrubbing 0→100% on the vase JSON shows bead accumulation and robot tracking the bead head.
- **Risk:** Closed-form IK for 6700. Mitigation: have the GH exporter include joint angles in the JSON.

### Week 7 · Inspector + pre-flight checks (Tue June 30)
- **Goal:** Layer list, per-segment inspector, pre-flight check page.
- **Tasks:** Sidebar layer list (click to jump). Click a segment → right panel shows feed/flow/time. Reachability check, singularity proximity, time estimate, collision vs workcell mesh.
- **Done when:** Loading a deliberately broken toolpath surfaces the issue with a clear UI marker.

**Phase 2 demo (W7 pin-up):** Author a path in Grasshopper, export, drop into the twin, scrub through it, fix a warning, re-export. End-to-end offline workflow.

---

## Phase 3 — Twin Talks to the Machine (Weeks 8–10)

### Week 8 · RAPID generator (Tue July 7)
- **Goal:** JSON → `.mod` that runs on RobotStudio Virtual Controller.
- **Tasks:** `bridge/rapid_gen.py`. `MoveL` per move. ABB orient quaternion (w-first). Tool data. Extruder triggers via `SetDO`/`PulseDO`. Test on Virtual Controller.
- **Done when:** UI scrubber and RobotStudio Virtual Controller produce matching TCP traces within 2 mm.

### Week 9 · RWS bridge (Tue July 14)
- **Goal:** Live joint state and motion status streaming from the real IRC5.
- **Tasks:** Vendor `rpiRobotics/abb_robot_client` into `bridge/vendored/`. `bridge/server.py` (FastAPI) with WebSocket `/live`. Localhost-only binding.
- **Done when:** `curl http://localhost:8000/state` shows live joint angles while the arm is jogging.

### Week 10 · LIVE mode wiring (Tue July 21)
- **Goal:** Real arm jogged manually → twin mirrors in <100 ms.
- **Tasks:** `ui/src/lib/rws.ts` WS client + Zustand store. CAM/LIVE/VIZ mode toggle with **large color-coded banner** so mode is never ambiguous.
- **Done when:** Operator jogs the IRB 6700, the URDF in the browser follows it with no visible lag at 30 fps.

**Phase 3 demo (W10 pin-up):** Stand at the controller, jog the arm, point at the screen. Twin matches.

---

## Phase 4 — Twin Remembers (Weeks 11–12)

### Week 11 · Recording + REPLAY (Tue July 28)
- **Goal:** Every print is captured to a `.jsonl` log that VIZ mode replays.
- **Tasks:** Bridge logs all WS messages with timestamps. VIZ mode loads a log, scrubs through history, highlights frames where commanded vs actual TCP error >1 mm.
- **Done when:** A 5-minute test print can be replayed end-to-end from the log.

### Week 12 · Deposition viz + quality dashboard (Tue August 4)
- **Goal:** During a live print, watch the bead accumulate and read per-layer quality metrics.
- **Tasks:** InstancedMesh tube accumulator driven by live TCP + extrusion flag; bucket by layer for LOD recycling. Color by feedrate / flow / deviation. Per-layer charts (layer time, TCP error, bead width); anomaly highlight on outlier layers; side-by-side print comparison.
- **Done when:** A live print's deposition grows in the viewport, matching the physical bead within 5 mm; comparing two prints surfaces differences quantitatively.

**Phase 4 demo (W12 pin-up):** Run a real print, watch live, stop, replay, analyze. Done.

---

## Phase 5 — Twin Listens (Weeks 13–14) · LLM Agentic UI

This phase is the reason the previous four exist. Only two weeks — every hour matters.

### Week 13 · Tool surface for the agent (Tue August 11)
- **Goal:** Define and ship the tool API the LLM will call.
- **Tasks:** Design the function-calling spec. Three tool tiers:

  **Query tools** (read-only, ungated):
  - `query_state()` → joint angles, TCP, mode, program
  - `query_telemetry(metric, layer?)` → temp, flow, error history
  - `query_log(filter?)` → events from `.jsonl`
  - `list_toolpaths()` / `load_toolpath(id)` / `simulate_toolpath(id, speed?)`
  - `list_layers(toolpath_id)` / `inspect_layer(toolpath_id, idx)`
  - `set_view(target)` / `highlight_layer(idx)` / `highlight_segment(...)`
  - `compare_prints(log_id_1, log_id_2)`

  **Edit tools** (non-destructive — produce a new JSON file, preview before save):
  - `modify_layer_feedrate(toolpath_id, layer_range, factor)` → e.g. layers 12–20 × 0.5
  - `modify_layer_flow(toolpath_id, layer_range, factor)`
  - `delete_layers(toolpath_id, layer_range)`
  - `duplicate_layer(toolpath_id, layer, count)`
  - `transform_segment(toolpath_id, layer_range, translation?, rotation?, scale?)`
  - `slice_range(toolpath_id, start_layer, end_layer)` → sub-program
  - All edits return `{new_toolpath_id, diff_preview}` — UI shows old (dim) vs new (highlight) overlay; nothing is saved until the user confirms.

  **Action tools** (gated, require explicit confirmation token):
  - `propose_motion(target_pose, type)` → returns a draft motion command, NOT executed
  - `execute_proposed_motion(command_id)` → runs only if user clicks Confirm + holds dead-man
  - `generate_rapid(toolpath_id)` → produces `.mod`
  - `send_rapid_to_controller(mod_file)` → loads on IRC5 (still needs Play to run)
  - `stop_motion()` → e-stop (never gated)

- **Done when:** `curl http://localhost:8000/tools/query_state` returns live data. All tools have JSON schemas. Edit tools always write to a new file (never mutate the original). Action tools refuse to run without a confirmation token.
- **Risk:** Tool design is the load-bearing decision. Spend the full week on it; don't rush.

### Week 14 · Agentic chat UI + final demo (Tue August 18)
- **Goal:** Type a prompt in the twin, the LLM uses tools to answer or act. Final review same day.
- **Tasks:**
  - Anthropic Claude API integration (tool-calling). Optional fallback: local model via Ollama for prompts that don't need motion.
  - Chat panel in the twin (right-side dock, like the current telemetry panel).
  - Agent loop: user → LLM → tool calls → tool results → LLM → response, with all intermediate calls visible to the user.
  - **Safety policy module:** action tools require a UI confirmation modal showing the proposed motion as a ghosted preview before execution. Speed/joint-limit caps enforced bridge-side regardless of LLM intent. Dead-man (spacebar) must be held during execution.
  - Four example prompts that must work end-to-end:
    1. *"What went wrong with the print from yesterday?"* → query tier: `list_logs`, `query_log`, `inspect_layer` → narrative response with screenshot.
    2. *"Show me layer 47 only and color by feedrate."* → query tier: `highlight_layer`, `set_view`, `color_by_metric`.
    3. *"Home the robot."* → action tier: `propose_motion(home)` → UI confirmation modal → user clicks Confirm + holds dead-man → `execute_proposed_motion` → robot moves.
    4. *"Rerun layers 12–20 at half feed."* → edit + action chain: `modify_layer_feedrate(layers=12..20, factor=0.5)` → UI shows old-vs-new overlay → user confirms edit → `generate_rapid(new_toolpath_id)` → confirmation modal → execute. The diagnostic + edit + re-execution loop.
  - 3-minute video walkthrough.
- **Done when:** All four example prompts work without manual intervention beyond the two safety confirmations. Live final demonstration runs end to end.
- **Risk:** Hallucinated tool calls or unsafe motion suggestions. Mitigation: refuse-by-default in action tools, narrow tool surface, system prompt explicitly tells the LLM to ask before acting.

**Phase 5 demo (final):** Type "what's wrong with this print?" → LLM analyzes log → shows layer 47 with TCP error spike. Type "rerun layers 12–20 at half feed" → LLM generates a sub-program → UI shows ghosted preview → user confirms → robot runs it. The twin commands the robot through language.

---

## Architectural notes

### Why this order works

- **Research first.** Week 1 is the only week without code. Locking design positions before scaffolding prevents the most common project failure: rewriting in Week 8 because we didn't know what we wanted in Week 1.
- **Twin from Week 2.** The mockup appears in the browser by end of Week 2 — rough but real. Avoids the trap of "we'll have something to show after the URDF is perfect."
- **Real data by Week 4.** From Phase 2 onward, every improvement is felt immediately on real work, not synthetic data.
- **Live before agent.** The LLM can't drive a robot it can't observe. Phases 3–4 give the agent its eyes and memory. Phase 5 gives it a voice.
- **Safety is enforced in the bridge, not in the LLM.** The LLM proposes; the bridge disposes. Joint limits, speed caps, dead-man, and confirmation modals are all enforced server-side, so a hallucinated tool call can't move the robot.

### Tool surface as the contract

The same JSON schema that defines the LLM's tool surface in Phase 5 is the contract for *everything* the twin can do — including manual UI buttons. Every button in the twin is a thin wrapper around a tool call. This means:

- The UI is testable end-to-end via `curl`.
- The LLM has access to exactly what the user has access to (no more, no less).
- Adding a new capability means adding one tool, not one tool + one UI + one LLM hook.

### What "agentic" means here

Not "Claude drives the robot autonomously." It means:
- The LLM has a finite set of tools across three tiers: **query** (read-only, ungated), **edit** (writes a new file, gated by preview-and-confirm), **action** (runs motion, gated by confirmation + dead-man).
- It chooses which tools to call to answer a question or accomplish a task.
- The agent loop is visible — the user sees every tool call and every result, not just the final answer.
- Edits are always non-destructive — the original toolpath is never mutated, only new files are written. So an LLM mistake costs a file, not a part.

---

## Cross-cutting checklist

- [ ] **Units.** mm in toolpath JSON, meters in URDF/scene. One conversion boundary, documented.
- [ ] **Frames.** ABB world ↔ URDF base ↔ three.js Y-up. Pick once, write it down.
- [ ] **Mode banner.** CAM / LIVE / VIZ visually unmistakable from Week 2 (not a Phase 4 refactor).
- [ ] **Tool surface as contract.** Every UI action calls a tool; tools have JSON schemas.
- [ ] **Network safety.** RWS bridge bound to localhost until reviewed in Week 10.
- [ ] **Safety in the bridge.** Joint limits, speed caps, dead-man, confirmation modal — server-side, not LLM-side.
- [ ] **Logging.** Every WS frame, every tool call, every LLM response logs to disk.

## Definition of "done" for the whole project

1. Open the twin in a browser.
2. Type *"what's wrong with this print?"* — LLM analyzes the last log, surfaces the issue.
3. Type *"rerun layers 12–20 at half feed"* — LLM proposes the sub-program, UI shows a ghosted preview, user confirms, robot runs it.
4. Watch the deposition grow in real time, mirrored in the twin.
5. Stop, switch to VIZ, scrub back through what just happened.

If those five things work without touching a terminal, the project is done.
