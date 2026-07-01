**Course Number:** RX-4501: Robotic 3D Printing — Digital Twin to Agentic Control
**SCI-Arc Semester:** Summer 2026

**Instructors**
- Shiny Yim (shiny.yim@gmail.com)

**Course Meetings**
- Tuesdays: 2:00 pm – 5:00 pm (seminar, one session per week)
- First meeting: Tuesday, May 19, 2026
- Final meeting: Tuesday, August 18, 2026

---

## Course Abstract
Robotic 3D Printing: Digital Twin to Agentic Control is a fourteen-week applied research seminar that builds, end to end, a browser-based digital twin for a large-format robotic 3D printing workcell, ending in a natural-language **agentic interface** that commands the physical ABB IRB 6700-175/3.05 robot through the twin. Week 1 is dedicated to research and references; from Week 2 students iterate a working twin in the browser, deepening it each subsequent week — accurate kinematics, real toolpaths, sim coupling, live telemetry, recording, deposition visualization — until in the final phase the twin becomes a substrate for an LLM agent that observes, proposes, and (with human confirmation) executes robotic motion through natural language.

## Course Description
This seminar approaches the digital twin not as a marketing concept but as the **substrate for a new kind of human–robot interface**. The discipline is not "build a model of the factory in the cloud." It is: build the smallest twin that lets a person talk to a robot in language, observe what the robot is doing, and intervene safely.

Where most robotic AM software exposes the machine through a custom GUI of buttons, jog wheels, and modal dialogs, this seminar designs an interface organized around a **tool surface** — a finite, well-typed API that both manual UI elements and an LLM agent call. The same `propose_motion()` function that powers a button also powers a chat command. The same `query_log()` that fills a chart also answers "what went wrong yesterday?" The twin becomes legible to both humans and language models.

We frame the project as a sequence of capabilities the twin acquires: students first **research** the field (Week 1), then the twin **appears** as a mockup (Week 2) and is grounded in accurate data (Weeks 3–4), then it **speaks** (preview), **talks to the machine** (sim + live), **remembers** (recording + replay), and finally **listens** (LLM agent). Most phases are three weeks; the final two are two weeks each — intentionally compressed so that the agentic phase remains a sharp endpoint, not a victory lap.

## Course Organization
The seminar is organized into **five phases over fourteen weeks (4 + 3 + 3 + 2 + 2)**, each ending in a demoable artifact that the next phase depends on. Phase boundaries are firm; week boundaries are soft. Work is individual and primarily done between sessions; the weekly Tuesday meeting is for review, discussion, and demonstration of the past week's progress, with end-of-phase pin-ups serving as collective milestones.

| Phase | Weeks | Theme | End-of-phase artifact |
|---|---|---|---|
| 1 — Research & Foundation | 1–4 | Research brief → twin mockup → accurate URDF → real toolpath | Browser twin shows real URDF + workcell + Grasshopper toolpath JSON |
| 2 — Twin Speaks | 5–7 | Toolpath rendering + scrubber + inspector + pre-flight | Drag scrubber → robot poses → deposition grows; warnings surface broken paths |
| 3 — Twin Talks to the Machine | 8–10 | RAPID generator + RWS bridge + LIVE mode | Real robot moves → twin mirrors in <100 ms |
| 4 — Twin Remembers | 11–12 | Recording, REPLAY, live deposition viz, quality dashboard | A real print is captured, replayed, and analyzed |
| 5 — Twin Listens | 13–14 | LLM agentic UI with tool calling + safety-gated motion | Natural-language commands move the robot through the twin |

## Material Needs
- Personal laptop capable of running Rhino 8 + Grasshopper, a modern web browser, and a Python 3.11+ development environment.
- Access to SCI-Arc Robot House: ABB IRB 6700-175/3.05 with IRC5 controller, RobotStudio 2024+ workstation, large-format pellet extruder end-effector.
- Rhino 8 license (educational pricing through SCI-Arc IT).
- Anthropic API key for Phase 5 (provided via seminar account) or local LLM via Ollama as fallback.
- GitHub account for version control.
- Optional: external monitor for split-screen sim/UI development.

---

## Student Learning Objectives and Outcomes

- **Objective 1:** The seminar prepares students to construct browser-based digital twins of industrial robotic systems from manufacturer documentation, CAD exports, and live controller telemetry.
- **Outcome 1:** Students will deliver a working, browser-based twin of an ABB IRB 6700-175/3.05 with hand-authored URDF whose forward kinematics match RobotStudio's Virtual Controller within one millimeter, demonstrated at five independent joint configurations.

- **Objective 2:** The seminar familiarizes students with the design of neutral data contracts that bridge desktop CAD/CAM authoring tools and browser-based runtime systems.
- **Outcome 2:** Students will design, document, and implement a JSON toolpath schema and matching Grasshopper Python exporter, such that a single source file can be consumed by both a RAPID code generator and a Three.js visualizer without modification.

- **Objective 3:** The seminar prepares students to engage and participate in architectural research that tests innovations in human–robot interaction. *(NAAB PC.5 Research and Innovation.)*
- **Outcome 3:** In Week 1, students will deliver a written research brief comparing three contemporary robotic AM toolchains (COMPAS_RRC, MX3D MetalXL, gkjohnson urdf-loaders) and three contemporary agentic interfaces (Claude tool-use, Cursor, Open Interpreter), identifying which architectural and interaction patterns they adopt or reject in their own twin, and why.

- **Objective 4:** The seminar exposes students to real-time control protocols and the safety considerations they impose on operator-facing and language-model-facing interfaces.
- **Outcome 4:** Students will implement a Python-to-browser WebSocket bridge that streams live joint state and motion status from the IRC5 controller using ABB Robot Web Services, and will demonstrate a layered safety architecture in which all motion-commanding tools require explicit human confirmation, with joint limits, speed caps, and dead-man enforcement implemented server-side and therefore unbypassable by an LLM agent.

- **Objective 5:** The seminar improves students' technical communication skills through code, documentation, and demonstration of an agentic interface. *(NAAB A.1 Professional Communication Skills.)*
- **Outcome 5:** Students will deliver a final demonstration in which a non-expert observer types natural-language prompts into the twin's chat interface, the LLM agent uses a documented tool surface to answer or act, and proposed motions are confirmed and executed on the real robot — all without the student touching a terminal mid-demo.

---

## Project(s) Overview
The seminar is organized around a single cumulative project: the digital twin and its agentic interface. The five phase artifacts function as graded milestones; each builds on the previous and cannot be skipped. Students who fall behind in a phase may not advance without instructor approval, because the next phase consumes the previous phase's artifact directly.

**Phase 1 Artifact — Research & Foundation.** A written research brief (due end of Week 1) comparing three robotic AM toolchains and three agentic interfaces, *and* a browser-based scene by end of Week 4 showing the validated IRB 6700-175/3.05 URDF, the converted workcell as glTF, and at least one real toolpath JSON exported from the student's Grasshopper definition. Demo: by end of Week 2 the twin is already on screen as an HTML/CSS + Three.js mockup; by end of Week 4 it shows real geometry, real path, real arm.

**Phase 2 Artifact — Twin Speaks.** A working browser-based authoring UI with toolpath rendering, layer scrubber, IK posing, deposition accumulation, layer list, per-segment inspector, and pre-flight checks (reachability, singularity proximity, time estimate, collision). Demo: drop a Grasshopper JSON, scrub 0→100 %, see warnings on a broken path.

**Phase 3 Artifact — Twin Talks to the Machine.** A Python RAPID generator producing `.mod` files runnable on RobotStudio Virtual Controller, plus a FastAPI WebSocket bridge streaming live joint state from the real IRC5, with the browser UI mirroring the real arm in LIVE mode. Demo: jog the arm by hand, twin mirrors within 100 ms.

**Phase 4 Artifact — Twin Remembers.** A recording layer producing `.jsonl` state logs during prints, a VIZ mode that replays them, a live deposition visualization that grows during prints, and a per-layer quality dashboard. Demo: run a short test print, watch it live, replay it, compare it to a previous run.

**Phase 5 Artifact — Twin Listens.** An LLM-driven chat panel in the twin with a documented tool surface across three tiers — **query** (read-only, ungated), **edit** (non-destructive toolpath modifications gated by preview-and-confirm), and **action** (motion-commanding tools gated by explicit human confirmation + dead-man) — implementing Anthropic Claude tool-calling. Demo: four example prompts — *(a)* "What went wrong with yesterday's print?", *(b)* "Show me layer 47 colored by feedrate.", *(c)* "Home the robot.", *(d)* "Rerun layers 12–20 at half feed." — the fourth chaining diagnosis, edit, and re-execution through the chat, with the user confirming the edit preview and the motion execution as two separate gates.

## Tools and Techniques
- **Authoring:** Rhino 8, Grasshopper, custom Grasshopper Python 3 components.
- **Simulation:** RobotStudio 2024 with Virtual Controller; ABB Library robot models.
- **Robotics protocols:** ABB Robot Web Services (RWS) over WebSocket, Externally Guided Motion (EGM) over UDP, RAPID.
- **Bridge:** Python 3.11+, FastAPI, `uvicorn`, vendored `rpiRobotics/abb_robot_client`, `rhino3dm`, `trimesh`, `numpy`.
- **Frontend:** TypeScript, React, Vite, `three.js`, `@react-three/fiber`, `@react-three/drei`, `urdf-loader` (gkjohnson), Zustand.
- **Agent:** Anthropic Claude API (tool-calling), JSON Schema for tool definitions, optional local fallback via Ollama.
- **Validation:** `urdfpy` or `yourdfpy` for forward-kinematics comparison against RobotStudio TCP readouts.
- **Conversion:** `scripts/rhino_to_glb.py`, FreeCAD Mesh workbench for STEP→STL fallback.
- **Version control:** Git + GitHub.

These tools build on prior coursework in computational design (Rhino + Grasshopper), introductory programming (Python), and visual fabrication studios that introduced robotic kinematics conceptually but not as software systems.

## Components of Grading

| Percentage | Description |
|---:|---|
| 10 % | Week 1 Research Brief (3 toolchains × 3 agentic interfaces — written, ~1500 words) |
| 15 % | Phase 1 Artifact — Twin Foundation (mockup → accurate URDF → real toolpath, due end Week 4) |
| 15 % | Phase 2 Artifact — Twin Speaks (authoring UI with scrubber, inspector, pre-flight) |
| 20 % | Phase 3 Artifact — Twin Talks to the Machine (RAPID gen + RWS bridge + LIVE mode) |
| 10 % | Phase 4 Artifact — Twin Remembers (recording + REPLAY + deposition viz + dashboard) |
| 20 % | Phase 5 Artifact — Twin Listens (LLM agentic UI with safety-gated motion) |
| 10 % | Attendance, weekly seminar engagement, mid-phase peer review participation |
| **100 %** | **Total** |

---

## Course Schedule

### Week 1 (May 19 – May 25)_ Research
- **Tue May 19:** Seminar opens. Equipment walkthrough at Robot House. Attendance and participation policies. Discussion: *what is a digital twin actually, and what does it become when an LLM can talk to it?* Survey of comparable projects (ETH DFAB, ICD Stuttgart, MX3D MetalXL, AI Build, Aibuild, COMPAS_RRC). Survey of agentic-UI patterns (Claude tool-use, Cursor, Open Interpreter). ABB IRB 6700 documentation review (product manual 3HAC044266-001 walkthrough). RobotStudio familiarization.
- **Deliverable (due Week 2 session):** **Research Brief** — ~1500 words comparing three robotic AM toolchains and three agentic interfaces, with explicit positions on which architectural and interaction patterns the student will adopt or reject in their own twin.

___

### Week 2 (May 26 – June 1)_ Twin Mockup
- **Tue May 26:** Present research briefs (10 min each). Build the twin as a static **HTML/CSS + Three.js mockup** with placeholder URDF (ros-industrial nearest IRB 6700 variant), canned toolpath, dummy telemetry. Establish layout: 3D viewport, layer list, telemetry panel, mode banner, transport controls. Scaffold `ui/` (Vite + React + TS + three + r3f + drei + urdf-loader).
- **Reading due (next session):** Gramazio & Kohler, *The Robotic Touch*, introduction.
- **Deliverable (next session):** `npm run dev` opens the mockup with placeholder arm animating along the example toolpath. Looks rough; looks alive.

___

### Week 3 (June 2 – June 8)_ Twin Accurate
- **Tue June 2:** Present Week 2 mockup. RobotStudio export workflow walkthrough (`docs/robotstudio_export.md` Steps 1–4). ABB DH parameter identification for the 175/3.05 variant. URDF authoring; substitute exported meshes; write joint origins from DH. FK validation against RobotStudio at 5 random joint vectors.
- **Deliverable (next session):** Placeholder URDF replaced with hand-authored `data/robot/irb6700_175_305.urdf`, documented <1 mm FK error.

___

### Week 4 (June 9 – June 15)_ Twin Grounded
- **Tue June 9:** Present URDF validation report. `.3dm` → `.glb` conversion using `scripts/rhino_to_glb.py`. Toolpath schema review (`data/toolpaths/schema.md`); quaternion conventions (ABB orient w-first vs three.js xyzw). Grasshopper Python exporter integration; generate real toolpath JSON for a test geometry.
- **End-of-Phase-1 Pin-Up.** Demo browser twin: real arm + real workcell + real Grasshopper path.

___

### Week 5 (June 16 – June 22)_ Toolpath Rendering
- **Tue June 16:** `TubeGeometry` per move, color by `move.type` (print=amber, travel=cyan). Switch to `LineSegments2` above 5 000 moves. Layer filter checkboxes. Performance test with a 240-layer real path.
- **Reading due (next session):** Selected COMPAS_FAB documentation chapters.

___

### Week 6 (June 23 – June 29)_ Scrubber + IK + Deposition
- **Tue June 23:** Scrubber UI (move-index based). IK posing — closed-form or interpolated joint angles from the JSON. Deposited tube grows as scrub advances; upcoming path stays as a thin line.

___

### Week 7 (June 30 – July 6)_ Inspector + Pre-Flight Checks
- **Tue June 30:** Sidebar layer list (click-to-jump). Per-segment inspector on right panel. Reachability check (FK + workspace), singularity proximity warnings, collision vs workcell mesh, print time estimate.
- **End-of-Phase-2 Pin-Up.** Demo: drop a Grasshopper JSON, scrub through it, fix a flagged warning, re-export.

___

### Week 8 (July 7 – July 13)_ RAPID Generator
- **Tue July 7:** `bridge/rapid_gen.py`. `MoveL` per move with ABB orient (w-first quaternions). Tool data declaration; extruder triggers via `SetDO` / `PulseDO`. Run on RobotStudio Virtual Controller; TCP trace comparison against UI scrubber (<2 mm).
- **Reading due (next session):** Vision-based DT for conformal 3DCP (*Construction Robotics*, 2024).

___

### Week 9 (July 14 – July 20)_ RWS Bridge
- **Tue July 14:** Vendor `rpiRobotics/abb_robot_client` into `bridge/vendored/`. Confirm IRC5 RobotWare version. `bridge/server.py` (FastAPI) with `WS /live`; subscribe to `/joint_states`, `/motion_status`, `/io_signals`. Localhost-only binding verified. `curl /state` returns live joint angles while the arm is jogged.

___

### Week 10 (July 21 – July 27)_ LIVE Mode Wiring
- **Tue July 21:** `ui/src/lib/rws.ts` WS client + Zustand store. Mode toggle CAM / LIVE / VIZ with large color-coded mode banner. Jog the real arm by hand, twin mirrors within 100 ms.
- **End-of-Phase-3 Pin-Up.** Demo: stand at the controller, jog the arm, show the screen.

___

### Week 11 (July 28 – August 3)_ Recording + REPLAY
- **Tue July 28:** Bridge logs all WS frames with timestamps to `.jsonl`. VIZ mode loads a log file, scrubs through history. Highlight frames where commanded vs actual TCP error >1 mm.

___

### Week 12 (August 4 – August 10)_ Deposition Viz + Quality Dashboard
- **Tue August 4:** InstancedMesh tube accumulator driven by live TCP + extrusion flag. Bucket by layer for LOD recycling. Color by feedrate / flow / deviation. Per-layer charts (layer time, average TCP error, bead width); anomaly highlight on outlier layers; side-by-side print comparison.
- **End-of-Phase-4 Pin-Up.** Demo: real print run live → stop → VIZ replay → compare to a previous run.

___

### Week 13 (August 11 – August 17)_ Tool Surface for the Agent
- **Tue August 11:** Tool design workshop. Three tiers:
  - **Query** (ungated): `query_state`, `query_telemetry`, `list_toolpaths`, `inspect_layer`, `set_view`, `highlight_layer`, `compare_prints`.
  - **Edit** (preview-and-confirm, writes new file): `modify_layer_feedrate`, `modify_layer_flow`, `delete_layers`, `duplicate_layer`, `transform_segment`, `slice_range`.
  - **Action** (confirmation + dead-man): `propose_motion`, `execute_proposed_motion`, `generate_rapid`, `send_rapid_to_controller`, `stop_motion`.

  Implement query and edit tools as FastAPI endpoints with JSON Schema declarations. Edit tools always write to a new toolpath file and return a diff for UI overlay; the original is never mutated. Implement action tools with explicit `confirmation_token` parameter. Server-side enforcement of joint limits, speed caps, dead-man requirement.
- **Reading due (next session):** Anthropic, *Tool use with Claude (function calling guide)*, 2024.

___

### Week 14 (August 18)_ Agentic Chat UI + Final Demo
- **Tue August 18:** Anthropic Claude API integration with tool-calling. Chat panel in the twin (right dock). Agent loop visible to user — every tool call and result shown inline. Four required prompts spanning the three tool tiers:
  1. *"What went wrong with the print from yesterday?"* — query tier.
  2. *"Show me layer 47 only and color by feedrate."* — query + view.
  3. *"Home the robot."* — action tier.
  4. *"Rerun layers 12–20 at half feed."* — edit + action chain: the agent modifies the toolpath (new file), the UI shows an old-vs-new overlay, the student confirms the edit, the agent then generates RAPID and proposes execution, and the student confirms motion separately.

  Confirmation modal with ghosted 3D preview of any proposed motion. Dead-man (spacebar held) required during execution. **Final review same day**: live demonstration of natural-language control end to end + 3-minute video walkthrough.

___

## Readings / Reference Material
- Gramazio, Fabio, and Kohler, Matthias. *The Robotic Touch: How Robots Change Architecture.* Zürich: Park Books, 2014.
- Menges, Achim, ed. *Material Computation: Higher Integration in Morphogenetic Design.* AD Architectural Design. London: Wiley, 2012.
- Willmann, Jan, Block, Philippe, Hutter, Marco, Byrne, Kendra, and Schork, Tim, eds. *Robotic Fabrication in Architecture, Art and Design 2018.* Cham: Springer, 2019.
- García del Castillo y López, Jose Luis. *Robotic Toolpath Generation for Architecture: A Computational Approach.* PhD diss., Harvard GSD, 2019.
- ABB Robotics. *Product Manual — IRB 6700 (3HAC044266-001).* Västerås: ABB AB, 2020.
- ABB Robotics. *Application Manual — Robot Web Services.* Västerås: ABB AB, 2023.
- Casas-Cartagena, Gonzalo, et al. "Vision-based sensing and digital twin for non-planar concrete printing." *Construction Robotics* 8, no. 1 (2024).
- Anthropic. *Tool use with Claude (function calling).* Documentation, 2024. https://docs.claude.com/en/docs/tool-use
- Anthropic. *Building effective agents.* Engineering blog post, 2024.
- Schick, Timo, et al. "Toolformer: Language Models Can Teach Themselves to Use Tools." *arXiv:2302.04761*, 2023.
- Yao, Shunyu, et al. "ReAct: Synergizing Reasoning and Acting in Language Models." *ICLR*, 2023.
- Liang, Jacky, et al. "Code as Policies: Language Model Programs for Embodied Control." *ICRA*, 2023.
- ETH NCCR Digital Fabrication. *DFAB HOUSE: A Comprehensive Demonstrator.* Zürich: NCCR DFab, 2019.

---

## Grading Procedures
Grades will be determined based upon the meeting of student learning objectives, quality of work produced, improvement over the course of the semester, completion of project requirements, quality of participation, attendance, attitude, and ethical conduct. SCI-Arc grading policies will be discussed on the first day of class, and any questions regarding grades or policies should be directed to the instructor and/or Lisa Russo, the registrar. A passing grade in the course requires committed completion of all projects. Incomplete work will not be evaluated.

From the SCI-Arc Student Handbook: SCI-Arc employs a narrative grading system, as follows: credit with distinction (CR+), credit (CR), marginal credit (CR-), conditional credit (CCR), no credit (NC), incomplete (I) and withdrawal (W). The grade of no credit (NC) is given whenever cumulative work, final work, and/or attendance are unsatisfactory. It is also given when a student fails to submit a final project or fails to take a final examination without prior approval from the instructor. No credit (NC) grades cannot be altered.

**GPA Equivalents**

| Grade | Point equivalent |
|---|---|
| CR+ | 4.0 |
| CR  | 3.35 |
| CR– | 2.7 |
| CCR | 2.0 |
| NC  | 0.0 |
| I   | 0.0 |
| W   | 0.0 |

## Seminar Policies
The seminar meets Tuesdays from 2 pm to 5 pm. Attendance is mandatory at all sessions, especially at critiques, pin-ups, and reviews. If you do not present your work at end-of-phase pin-ups, you will not receive credit. Because the seminar meets only once a week, substantial work is expected between sessions; class time is reserved for review, discussion, demonstration, and instructor-led workshops, not for primary execution. Coming late or leaving early may count as an absence. Grades will be determined upon the quality of work produced, improvement over the course of the semester, completion of project requirements, quality of participation, and attendance.

## Academic Integrity Policy (from SCI-Arc Student Handbook)
SCI-Arc takes issues of academic integrity seriously, including plagiarism, which can occur in design classes as well as core and elective classes. Some examples of plagiarism include:
- Copying words, images, or other material without using quotation marks or other indications of the original source.
- Paraphrasing another person's ideas in your own words without crediting the original source.
- Taking sole credit for assignments without giving credit to those who worked with you.
- Submitting work for a course that has already/also been submitted for another course.
- Internet plagiarism, such as submitting work either found or paid for online, failing to cite any internet sources used, or cutting and pasting sentences from various websites to create a collage of uncited words.

In this seminar specifically: extensive reuse of open-source code and LLM-generated code is expected and required (urdf-loader, abb_robot_client, COMPAS, Claude API examples). All vendored or borrowed code must be cited in `README.md` with original LICENSE files preserved. LLM-generated code must be reviewed, understood, and credited as such in code comments where it represents non-trivial structure. Failure to credit reused or generated code constitutes plagiarism under SCI-Arc policy.

Note: the academic integrity policy contains several tiers, depending on the nature and extent of academic dishonesty involved and on whether the student has committed an academic offense before. All cases must be reported to the Academic Advisor and the report is added to the student's academic record. Refer to the SCI-Arc Student Handbook for the full academic integrity policy including what happens at various tiers, right of appeal, and possible disciplinary outcomes.

## Attendance Policy
Regular attendance and active participation are vital in architecture and design education, where learning is hands-on, collaborative, and iterative. As a result, students must not exceed the following attendance limits, regardless of whether absences are excused or unexcused, unless formal academic accommodations are approved. Exceeding the following limits may result in academic penalties such as grade reduction, course failure, or administrative withdrawal.
- **Seminar (1x/week): Max 3 unexcused / 4 total absences**

Excused absences include illness, medical or family emergencies, religious holidays (with notice), legal obligations, military duty, and disability accommodations.

Unexcused absences include undocumented absences, travel, or job conflicts without prior approval. Tardiness or leaving early may count as full absences.

Students must notify faculty in advance, submit documentation, and coordinate make-up work. Faculty must clearly state attendance policies, track attendance, and report extended absences (7+ days) to Academic Advising.

## Incomplete Work
A student may receive a grade of incomplete (I) by requesting permission from the instructor prior to the date of the final examination or presentation. Permission will be granted only under extraordinary circumstances and usually for medical reasons. Incompletes must be fulfilled to the satisfaction of the instructor no later than three (3) weeks after the end of term. The student is responsible for providing the instructor with the "Request for Credit" card used for this purpose. This card must be signed by the instructor and returned to the Registrar's office. Failure to do so will result in the incomplete (I) being changed to a no credit (NC). No credit grades cannot be altered.

## Appeal of a Grade
Evaluation and grading of a student's performance in a course is based upon the instructor's professional assessment of the academic quality of the student's performance on a body of work. Such assessments are nonnegotiable, and disputes about them do not constitute valid grounds for an appeal. Students are encouraged to contact their instructor for clarification regarding the grade received in their course.

Grade appeals are rare and subject to appeal only for the following three grounds:
- improper academic procedures that unfairly affect a student's grade.
- application of nonacademic criteria, such as: considerations of race, politics, religion, sex, or other criteria not directly reflective of performance related to course requirements.
- sexual harassment.

Students must meet with the Academic Advisor to review the appeal process if they believe the grade received meets one or more of the grounds listed above. Petitions must be settled, and a final grade submitted to the registrar no later than six weeks after the end of the term in which the course was completed.

## Archiving
The SCI-Arc Upload site is the school's official archive of each semester's work. This is a mandatory requirement of each student's coursework, and grades will not be submitted until work is uploaded. This archive will be used for all future publications and graphic material as well as for required accreditation needs of SCI-Arc.

In this seminar, the archive submission includes: the Week 1 research brief, the complete project repository (with `data/`, `bridge/`, `ui/`, `docs/`), the URDF validation report, the recorded `.jsonl` log of the final demo print, the chat transcript of the final agentic demonstration, the 3-minute video walkthrough, and a 1000-word reflective essay on the design choices made — especially around the tool surface and safety architecture for LLM-driven motion.

## Ownership of Student Work
Physical copies of student work submitted to the school to satisfy course requirements including but not limited to digital files, papers, drawings, and models become the property of the school. SCI-Arc shall have no obligation to safeguard such materials and may, at its discretion, retain them, return them to the student, or discard them.

Notwithstanding whether it retains any physical copies of such student works, SCI-Arc shall have an irrevocable, royalty-free, worldwide right in perpetuity to use, reproduce, display, and exhibit works created by students during their studies at SCI-Arc, in publications by or about SCI-Arc, on its websites, on social media, or otherwise. SCI-Arc will make a reasonable effort to credit the author(s) of student work included in publications or other uses. Excepting works which are created during a student's participation in a Sponsored Project, the student shall have the right to publish or present their own work without compensation to SCI-Arc. However, SCI-Arc must be informed of this publication and appropriately credited in this publication or presentation unless SCI-Arc requests not to be credited.

## Supporting Mental Health
Diminished mental health, including significant stress, mood changes, excessive worry, or problems with eating or sleeping can interfere with optimal academic performance. Reducing stigma about accessing mental health care supports students seeking professional help when it is needed. SCI-Arc provides all students with two free counseling sessions per year. Sessions are available two days per week throughout the fall and spring terms, and one day per week during the summer term. All counseling sessions are confidential. Only with your consent can any details of your session be shared with another individual. Information to schedule an appointment can be found on the Campus Life tab of MySciarc.

## Academic Accommodations
SCI-Arc provides reasonable accommodations in compliance with the ADA and related laws. Students must contact the Academic Advisor to begin the process, which requires documentation and is reviewed case-by-case. Students should share accommodation letters with faculty at the start of each term. Accommodations are not retroactive and do not excuse absences unless stated.

Contact the Academic Advisor or refer to SCI-Arc's Academic Accommodations Policy for details. https://my.sciarc.edu/ICS/Advising/Academic_Accommodations.jnz
