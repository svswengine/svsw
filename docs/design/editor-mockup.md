# M00 design record: editor visual mockup

This document records the M00 design ceremony for the svsw editor mockup.
The mockup itself sits beside it at `docs/design/editor/`; open
`index.html` in any browser. M00's index entry lives in
[docs/specs/README.md](../specs/README.md). S22, S23, and S24 consume the
finished mockup as their normative visual reference for the editor's panel
set, layout, and chrome.

## Decisions

The ceremony settled the eight questions M00's index entry left open.

1. **Identity.** The editor wears familiar dock-layout chrome and follows
   ImGui docking conventions rather than a custom layout language. Its hero
   features are the ones only a deterministic engine can show: tick-exact
   replay scrubbing, per-system stepping, world-hash visibility, and the
   typed command log (D21).
2. **Panel set (v1).** Menu bar and toolbar; scene tree; central viewport
   with an optional second pane behind a split toggle; inspector; asset
   browser; mod/data browser; console; profiler; command log; debugger
   with two sub-tabs, Script and Sim; timeline scrubber; status bar. A
   chunk-overlay toggle draws chunk grid lines and per-chunk hash chips
   over the viewport. Left out of v1: drag-to-rearrange docking, editor
   preferences, an animation timeline, and any authoring surface beyond
   these panels. The mockup shows the resting layout, not dock
   manipulation.
3. **Viewport representation.** CSS 3D: a perspective grid floor, a few
   cubes, a light gizmo, and selection outlines. No canvas, no static
   image; the scene stays inspectable DOM.
4. **Interaction fidelity.** Clickable flows, not a picture. Selection
   syncs viewport, tree, and inspector; transform fields edit; play,
   pause, step, and scrubbing run against in-memory state.
5. **Scripted demo.** A toolbar button plays a narrated sequence with
   captions: spawn an entity, watch the command log grow, step three
   ticks, scrub back, and watch the hash restore to its earlier value.
6. **Theme.** Dense, dark, information-rich, ImGui-honest: compact rows,
   1px borders, no gradients, no shadows beyond subtle panel separation,
   one accent color defined once.
7. **Location.** The design record and the mockup co-locate under
   `docs/design/`: this record as `editor-mockup.md`, the artifact as
   `editor/`.
8. **Distribution.** Repo-only. Publishing the mockup on GitHub Pages as a
   public design artifact stays recorded as an option to decide at S00,
   when the public surface goes live.

## Layout

- **Top.** A menu bar with working dropdowns, then a toolbar: the
  run-target dropdown with its pin, run/stop, the transport cluster
  (pause, step back, step forward), undo and redo, gizmo mode buttons
  (select, move, rotate, scale), the chunk-overlay toggle, the
  viewport-split toggle, and the `{ }` scripts button that focuses the
  Files explorer.
- **Left.** Two tabs, both labels visible even when the dock folds. Scene
  Tree holds expandable groups and generic entity names (crate_01,
  lamp_post, spawn_point). Files is a project explorer over mod scripts
  (Luau), engine sources (Odin), and server sources (Go), each row with a
  language badge and size; single-click selects and feeds the run target
  for runnable files, double-click opens the file as a center document.
- **Center.** A tabbed document workspace. The Scene document holds the
  viewport: a CSS 3D scene with a perspective grid floor, cubes, a light
  gizmo, and selection outlines. The chunk toggle adds chunk grid lines
  and per-chunk hash chips; the split toggle adds a second pane with a
  top-down camera. Script documents, opened from the Files explorer, the
  mod browser, a call-stack frame, or the debugger, are full-size editors
  with line numbers, breakpoint gutters, per-language syntax
  highlighting, an editable buffer, a find bar, and a reload-semantics
  chip; crates.luau also carries the current-line highlight. The tab bar
  scrolls when many documents are open. A timeline scrubber strip sits
  below the documents: a tick ruler, a playhead, and drag-to-scrub.
- **Right.** The inspector: the selected entity's component list
  (Transform with x/y/z fields, Render, Collider, Light, Tag), fields
  styled as editable.
- **Bottom left.** Tabs: Asset Browser and Mod/Data Browser. The mod
  browser lists loaded mods, `base` included, and the data-stage
  prototypes they define.
- **Bottom right.** Tabs: Console, Profiler, Command Log, Debugger. The
  debugger holds two sub-tabs: Script shows a compact source preview with
  the breakpoint gutter, a call stack whose frames open the script
  document, a watch list, and an open-in-editor button; Sim shows the
  per-system step list within one tick and a before/after entity state
  diff.
- **Status bar.** Tick counter, world hash in monospace, the focused
  document's language mode, the parity indicator (`headless == windowed`,
  D22 vocabulary), and a gate state chip.

## Behavior contract

- Vanilla JS over in-memory state in a single `mockup.js`. No frameworks,
  no build step, no fetch, no modules; the page works opened via
  `file://`.
- Click-to-select syncs viewport, tree, and inspector.
- Run boots the play-in-editor Session against the run target and
  advances ticks on a timer; pause halts them; step forward and step back
  move one tick either way; the Sim debugger tab steps one system at a
  time inside a tick.
- The center is a tabbed document workspace. The Scene document is
  permanent; project files open as closable documents from a double-click
  in the Files explorer or the mod browser, a call-stack frame, or the
  debugger's open-in-editor button. Breakpoints and the current line are
  one shared state per file; the crates.luau document and the debugger
  preview stay in sync.
- **The script IDE surface.** Each open file is an editor at mockup
  fidelity: line numbers, a breakpoint gutter, fake per-language syntax
  highlighting (keywords, strings, comments, numbers as CSS token spans),
  an editable buffer that marks the tab with a dirty dot, a find bar that
  highlights matching lines with a count, and File > Save to clear the
  dirty state and log save_file. Luau breakpoints share state with the
  debugger; Odin and Go gutter clicks log set_breakpoint and toast that
  native breakpoints land with S24b. File > New Script scaffolds a Luau,
  Odin, or Go file, adds it to the explorer, logs create_file, and opens
  it.
- **Reload semantics stay visible.** Each editor shows a chip: Luau
  hot-reloads (S22b, D60); Odin requires an engine rebuild (S02a); Go
  requires a services rebuild (S26). The status bar shows the focused document's
  language mode.
- The run target follows selection in the tree, asset, and mod browsers;
  the pin freezes it. The transport is bidirectional: step back replays
  to tick-1, and the fake hash restores identically because it derives
  from the same two integers, one tick less.
- Panel visibility lives in the View menu as checkable toggles; a hidden
  panel folds to a slim strip and the viewport takes the space. Each
  toggle logs toggle_panel. Drag-docking stays out of scope.
- Every menu item is selectable. Clicking appends the item's typed
  command to the command log; items marked live in the feature map also
  perform the action, and the rest raise a toast naming the owning spec.
  Undo and redo stay pure log navigation (D21) and append nothing.
- Every user action appends a typed command to the command log:
  spawn_entity, set_transform, select, set_gizmo_mode, run_session,
  stop_session, step_back, open_document, toggle_panel, toggles, sim
  controls. Undo and redo walk the log's edit commands (D21) and append
  nothing; undone entries dim in the log.
- **The deterministic fake hash rule.** The displayed world hash derives
  from two integers mixed into 16 hex characters: the tick number and the
  count of world-mutating commands logged at or before that tick.
  World-mutating means spawn_entity and set_transform; view and sim
  commands are logged but excluded, since a scrub must not perturb the
  hash it revisits. Scrubbing back to tick N therefore reproduces tick
  N's hash. The mockup fakes the world, not the determinism. Per-chunk
  chips derive the same way with chunk coordinates mixed in.
- Help > Mockup Tour plays the scripted sequence with captions and ends
  by pointing at the restored hash.

## Feature map

One row per menu item. Live items perform the action in the mockup;
toast items log their typed command and raise a toast naming the owning
spec. The owning spec is the spec that ships the real feature; rows
marked none are mockup-only chrome.

| Menu | Item | Mockup behavior | Owning spec |
|------|------|-----------------|-------------|
| File | New Scene | toast | S22 |
| File | Open Scene… | toast | S22 |
| File | Save Scene | toast | S22 |
| File | Recent Scenes (two entries) | toast | S22 |
| File | New Script > Luau, Odin, Go | live: scaffolds a file, opens it, logs create_file | S22 |
| File | Open File… | toast | S22 |
| File | Save | live: clears the dirty flag, logs save_file | S22 |
| File | Import Asset… | toast | S12a |
| File | Bake Assets | toast | S12a |
| File | Rebake All | toast | S12a |
| File | Project Settings | toast | S17 |
| File | Quit | toast | none |
| Edit | Undo | live: walks the log back, appends nothing (D21) | S22 |
| Edit | Redo | live: walks the log forward | S22 |
| Edit | Duplicate Entity | live: clones the selection, logs spawn_entity | S22 |
| Edit | Delete Entity | live: removes the selection, logs delete_entity | S22 |
| Edit | Select All | live | S22 |
| Edit | Deselect | live | S22 |
| Edit | Find Entity… | toast | S22 |
| Edit | Snap Settings | toast | S22 |
| Edit | Preferences | toast | S23 |
| View | Left Dock (Scene Tree / Files), Inspector, Bottom Left Dock, Bottom Right Dock, Timeline | live: checkable, folds the panel, logs toggle_panel | S23 |
| View | Files Panel | live: focuses the Files explorer, logs focus_files | S22 |
| View | Viewport > Shaded, Wireframe | live: render mode | S06 |
| View | Viewport > Overdraw | toast | S06 |
| View | Chunk Overlay | live: chunk grid and hash chips | S22 |
| View | Grid | live: hides grid lines | S23 |
| View | Gizmos | live: hides gizmo glyphs | S23 |
| View | Split Viewport | live: second pane | S23 |
| View | Reset Layout | live: restores all panels | S23 |
| Session | Run / Stop | live: boots or ends the Session | S22 |
| Session | Pause | live | S22 |
| Session | Step Forward | live | S22 |
| Session | Step Back | live: exact replay to tick-1 | S22 |
| Session | Run Headless | toast | S04 |
| Session | Verify Parity | toast reusing the current hash | S04 |
| Session | Load Replay… | toast | S02a |
| Session | Save Replay | toast | S02a |
| Session | Scrub to Tick… | live: prompts and scrubs | S22 |
| Session | Copy World Hash | live: clipboard and toast | S22 |
| Session | Re-record Goldens… | toast: sanctioned flow, requires stated intent | S02a |
| Session | Session Settings | toast | S22 |
| Mods | Mod List (base, sample_tweaks, extra_props) | checkable, toast on toggle | S15 |
| Mods | Reload Mods | toast plus reload_mods command and console line | S22b |
| Mods | Load Order… | toast | S15 |
| Mods | Check Conflicts | toast | S15 |
| Mods | New Mod (scaffold) | toast | S17 |
| Mods | Open Mod Folder | toast | S17 |
| Mods | Data-Stage Inspector | live: focuses the mod/data browser tab | S15 |
| Mods | Editor Scripts… | toast | S24 |
| Window | Layout > Default, Scripting, Debugging, Profiling | live: focuses the named panels | S23 |
| Window | Save Layout | toast | S23 |
| Window | Reset Layout | live | S23 |
| Window | Second Viewport | live: split toggle | S23 |
| Window | Fullscreen Viewport | live: folds all side and bottom panels | S23 |
| Help | Mockup Tour | live: the scripted walkthrough | none |
| Help | Keyboard Shortcuts | live: overlay | none |
| Help | About svsw | live: overlay | none |
| Help | Docs | toast | none |

## Acceptance

- The three files (`index.html`, `style.css`, `mockup.js`) open from
  `file://` in any browser, render without errors, and touch no network.
- The flows above work: select, edit a transform, run and stop, pause,
  step forward and back, scrub, undo, redo, open files from the explorer
  into editor tabs, edit a buffer and save it, find in a file, toggle a
  breakpoint in either view, open every menu, run the tour, step a
  system.
- Final acceptance is a human review checkpoint; visual design has no
  headless gate.

## Non-goals

- Pixel-final visual design.
- Real engine integration.
- ImGui implementation detail: the mockup decides what the editor shows;
  S22 to S24 decide how ImGui renders it.
- The 2026-07 M00 touch executed the recorded residuals against the
  artifact: sample files, badges, and menu labels read Luau; native
  breakpoints toast S24b; mod reload credits S22b (D60); and the menu
  row reads Editor Scripts, per D43's vocabulary. No residuals remain
  recorded.
