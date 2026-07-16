# M00 editor mockup — QA sweep record

Scope: `docs/design/editor/` (`index.html`, `style.css`, `mockup.js`).

## What the sweep covered

Three passes, each independent, then reconciled against each other:

1. **Live evidence probes.** Real browser runs at three viewport widths
   captured the accessibility tree, keyboard focus order, computed contrast
   ratios, console output, and DOM state after real user actions (tab walks,
   clicks, double-clicks, key presses).
2. **Static accessibility/semantics review.** Source-level read of
   `index.html`/`mockup.js`/`style.css` cross-checked against the live
   evidence, tracing each live-observed gap to its root cause in the shared
   `el()` helper, menu builder, and per-line editor renderer.
3. **Visual-system review.** Token discipline in `style.css`: spacing
   rhythm, type scale, border/z-index tokens, accent-color scoping, state
   coverage (`:hover`/`:active`/`:focus`), monospace/tabular figures,
   scrollbar treatment, contrast-token scoping.
4. **UX-heuristics review.** Interaction contracts across the four browser
   panels, session-state legibility, destructive-action safety, toast
   behavior, and the shortcut/help contract.

Rulebook: the `ui-ux-pro-max` skill checklist, adapted for a desktop-density
ImGui-style editor rather than a marketing or mobile surface (3:1 secondary
text floor, 4.5:1 body text, 44px touch targets waived in favor of a
44px-equivalent keyboard/tabindex requirement, 3-5s toast dwell, visible
`:active` states, `aria-live` on transient announcements).

## Findings

| Issue | Severity | Lens | Fix applied or skipped-with-reason |
|---|---|---|---|
| Menu bar and dropdowns keyboard-inoperable (no role/tabindex/keydown) | blocker | a11y | Fixed: `role=menubar/menu/menuitem`, `tabindex`, full keydown model (Enter/Space/Arrow keys, Esc) |
| Scene Tree/Files/Asset/Mod/Debugger rows unreachable by keyboard | blocker | a11y | Fixed: `role=tree`/`treeitem` with aria-selected/aria-expanded and arrow-key nav on Scene Tree/Files; tabindex + Enter/Space activation on asset/mod/proto/stack rows |
| `--faint` (#5c6269) fails 3:1 secondary-text floor on ~20 consumers | major | a11y | Fixed: raised to #747b84 (2.37-2.86:1 to 3.42-4.12:1 across bg0/bg1/bg2) |
| Live probe's "no contenteditable exists" claim was a probe-timing miss, not a defect | minor | a11y | Corrected in evidence; no code fix needed for the claim itself |
| Code editor is N independent per-line contenteditable regions with no container role | major | a11y | Fixed: `.ed-code` container gets `role=textbox aria-multiline=true aria-label="<path> code editor"`; per-line nodes kept (load-bearing for breakpoint/current-line styling) |
| Toasts auto-dismiss at 2500ms, no `aria-live` | major | a11y | Fixed: `role=status aria-live=polite` on `#toasts`; dwell raised to 4000ms; hover pauses the timer, click dismisses |
| Tab strips have no `role=tablist/tab/tabpanel` or `aria-selected` | major | a11y | Fixed: roles added, `aria-selected` toggled in `activateTab`, arrow-key navigation between tabs |
| Icon-only collapse buttons have no accessible name | minor | a11y | Fixed: `aria-label` added to all four `.collapse-btn` elements |
| `--accent` used for ~15 non-selection purposes (branding, badges, playhead, profiler bars) | major | visual | Skipped: partial credit — misleading header comment corrected, hover state no longer borrows accent; full retokenization into a second `--info` token is a maintainer design call, not a QA patch, and the brief forbids softening the established visual identity |
| No `:active` (pressed) state anywhere | major | visual | Fixed: `:active` rules added for buttons, tree/file/asset/mod/proto rows, dropdown items, stack rows — distinct from `:hover`, no layout shift |
| No scrollbar styling despite 8+ scroll regions in a dark chrome | major | visual | Fixed: `scrollbar-color`/`scrollbar-width` plus WebKit scrollbar rules, built from existing tokens |
| z-index has 6 raw magic numbers, no token scale | major | visual | Fixed: `--z-viewport-chips/label/caption/menu/toast/modal` added to `:root`; all literals replaced |
| `--faint` on `--bg2` specifically measures 2.37:1 (worst case) | major | visual | Fixed: covered by the `--faint` token bump above; `--dim` also bumped (#878d95 to #8f959d) for the same reason |
| "Disabled" state uses two different opacity values (0.45 vs 0.4) for one semantic | minor | visual | Fixed: `--disabled-opacity: 0.45` token, both rules reference it |
| Spacing off the 4/8px grid (`--row: 22px` cascades into 8 component heights) | minor | visual | Skipped: not a 1-2 line fix — rounding `--row` and the odd paddings would visibly change the density that defines the mockup; flagged for a deliberate follow-up, not patched blind |
| Edit > Select All is visual-only; `state.selected` unchanged, so Delete/Duplicate act on a hidden single target while the screen shows everything selected | major | ux | Fixed: visual-only select-all removed; menu item now toasts "would select every entity (multi-select) — lands with S22", matching the pattern for other unimplemented items |
| Help > Keyboard Shortcuts documents Q/W/E/R, Space, and arrow-key shortcuts that do not exist; the only real handler was Escape | major | ux | Fixed: Q/W/E/R (gizmo mode), Space (pause/resume), ArrowLeft/Right (tick step) implemented, guarded against inputs/contenteditable/open menus/trees/tabs |
| Closing a dirty script tab silently discards edits, no confirm, no undo | major | ux | Fixed: confirm dialog on close of a dirty tab, naming the file |
| Session state (stopped/running/paused) has no dedicated indicator; step/scrub work with no session running | major | ux | Fixed: `#st-session` status-bar chip shows stopped/running/paused, accent-colored while running; step/scrub kept as a deliberate inspection affordance while stopped (documented, not blocked) |
| Click semantics inconsistent across Scene Tree/Files/Asset/Mod panels; some rows retarget the run session silently, some are dead despite hover affordance | major | ux | Fixed: one contract everywhere — single-click selects (visible state + logged `select` command, no-op on re-click), double-click opens where openable; run-target changes now log `set_run_target` and flash the toolbar select |
| Determinism-tour demo is Help-menu-only; design record says it should be a toolbar button | major | ux | Fixed: toolbar "tour" button added, wired to the existing demo runner, matching the design record |
| Delete Entity has no confirm and no visible undo affordance at the moment of deletion | minor | ux | Fixed: confirm dialog names the entity and states "Edit > Undo restores it"; selection moves to the nearest tree sibling instead of an arbitrary dict key |
| Toast dwell below 3-5s rule, no hover-pause, no click-dismiss, abrupt eviction | minor | ux | Fixed (folded into the `aria-live` fix above): 4000ms dwell, hover pauses, click dismisses |
| Session > Scrub to Tick uses native `prompt()`; invalid input silently coerces to tick 0 | minor | ux | Skipped on the control choice, fixed on the defect: kept native `prompt()` at mockup fidelity; non-numeric input now shows a toast error instead of silently scrubbing to tick 0 |
| Find bar's zero-hit state is unstyled and the counter mislabels lines as matches | minor | ux | Fixed: "no matches" with a warn tint on zero hits; counter relabeled "N matching lines" |
| Pre-seeded console text ("tick 0") contradicts the actual boot tick (128) | minor | ux | Fixed: static console line removed from HTML; boot() emits the real seeded tick |

## Contrast ratios, before and after

| Pair | Before | After | Floor | Result |
|---|---|---|---|---|
| `--faint` on `--bg0` | 2.86:1 | 4.12:1 | 3:1 | pass |
| `--faint` on `--bg1` | 2.62:1 | 3.78:1 | 3:1 | pass |
| `--faint` on `--bg2` (worst case, `.comp-tag`) | 2.37:1 | 3.42:1 | 3:1 | pass |
| `--dim` on `--bg1` | 4.37:1 | 5.35:1 | 4.5:1 | pass |
| `--dim` on `--bg2` | (below 4.5) | 4.84:1 | 4.5:1 | pass |

Ratios computed with WCAG relative-luminance math against the actual
`:root` token values; the re-verification pass recomputed the same pairs
independently and got matching numbers.

## Re-verification results

Independent recheck against the fixed source and the running mockup:

- Console clean on load: pass, no console errors on fresh navigate/reload.
- Accessibility tree includes menu bar, tabs, and tree/file rows with the
  expected roles and names: pass.
- Tab reaches the menu bar; Enter opens a menu with focus on the first item;
  Escape closes it and returns focus to the menu bar: pass.
- Contrast pairs above recomputed independently: pass, matching the CSS
  file's own inline comments.
- Toasts carry `role=status aria-live=polite` and a real toast (triggered
  via File > Save Scene) lived roughly 4.9s, above the 3s floor: pass.
- Menu items functional end to end (Save Scene, Import Asset both logged
  correctly): pass.
- Opening a script from Files (double-click) renders a syntax-highlighted
  editor tab and logs `select`/`open_document`: pass.
- Toggling a gutter breakpoint sets the row class, renders the marker, and
  logs `set_breakpoint`: pass.
- Step-back then step-forward round-trips to the identical starting world
  hash: pass.
- Collapsing the left dock collapses the panel, expands the editor pane,
  and logs `toggle_panel`: pass.

No residual issues found in the recheck.

## What the real editor (S22-S24) must inherit

- **Every interactive surface is keyboard-reachable.** Menu bar, tree rows,
  list rows, and tab strips all need a tab stop and an activation key
  (Enter/Space), not just a click handler. ImGui gives windows and widgets
  built-in keyboard nav; do not build a custom mouse-only widget on top of
  it.
- **Selection state and displayed state are the same variable.** The mockup
  bug where "select all" painted a visual state without touching the
  underlying selection set is a class of bug ImGui's immediate-mode model
  makes easy to introduce (draw one thing, act on another) — keep a single
  selection source of truth that both the row highlight and the
  destructive-command handlers read.
- **Destructive actions get a confirm or a stated undo path**, not silence.
  Delete and discard-unsaved-changes both need one of the two, every time.
- **Session state (stopped/running/paused) is a first-class, always-visible
  field**, not inferred from a button label. Put it in the status bar from
  day one.
- **Every displayed key binding must have a real handler**, and vice versa —
  do not ship a shortcuts overlay that documents keys nothing listens for.
- **One click contract per row type across all panels**: single-click
  selects, double-click opens, and any silent side effect (like retargeting
  the run session) gets logged as its own command and a visible pulse, not
  a value change in a distant control.
- **Secondary-text and pressed-state color tokens carry a contrast
  minimum**, checked against every background they composite over, not
  just the one place they were first added.
- **Toasts and other transient status need `aria-live`, a 3-5s dwell, and a
  pause-on-hover.** ImGui has no native equivalent; the transient-message
  system built for the real editor should carry these from the start.
