/**
 * The marks' half of the adopted stylesheet.
 *
 * It is its own module so `src/stylesheet.ts` composes rather than grows, and
 * so this file is the one place a mark's look is decided. Every value here is
 * a token: a rule that spelled its own duration would stop honouring reduced
 * motion the moment a reviewer asked for it.
 */

/** Nothing here is positioned by a rule: a frame sets these four per node. */
const POSITIONED = `
  position: absolute;
  top: 0;
  left: 0;
  translate: var(--mk-x) var(--mk-y);
`.trim();

/**
 * A reviewer's colour arrives as `--mk-slot`, so an open comment takes its
 * author's hue and a status with something to say takes its colour over it.
 */
function paintCss(): string {
  return `
.mk-mark,
.mk-avatar {
  --mk-paint: var(--mk-pin, var(--mk-slot, var(--mk-accent)));
  --mk-ink: var(--mk-pin-ink, var(--mk-slot-ink, var(--mk-accent-ink)));
}

.mk-mark[data-status="needs_reverify"] {
  --mk-paint: var(--mk-pin, var(--mk-warn));
  --mk-ink: var(--mk-pin-ink, var(--mk-warn-sub));
}

.mk-mark[data-status="resolved"] {
  --mk-paint: var(--mk-pin, var(--mk-ok));
  --mk-ink: var(--mk-pin-ink, var(--mk-bg));
  opacity: 0.6;
}

.mk-mark[data-form="dashed"] {
  --mk-paint: var(--mk-pin, var(--mk-muted));
  --mk-ink: var(--mk-pin-ink, var(--mk-muted));
}
`;
}

/** The leaf: a halo, a body, a counter-filled ring and a dashed edge. */
function leafCss(): string {
  return `
.mk-leaf {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.mk-leaf-halo {
  fill: var(--mk-bg);
  stroke: var(--mk-bg);
  stroke-width: 8;
  stroke-linejoin: round;
}

.mk-leaf-body {
  fill: var(--mk-paint);
  stroke: var(--mk-paint);
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.mk-leaf-ring {
  fill: var(--mk-paint);
  stroke: none;
}

.mk-leaf-dashed {
  fill: none;
  stroke: var(--mk-paint);
  stroke-width: 3.2;
  stroke-dasharray: 8 5.5;
  stroke-linecap: round;
}
`;
}

/**
 * The mark. Its position is a custom property and carries no transition: a
 * transition on a position lags a frame behind the page it is standing on.
 */
function markCss(): string {
  return `
.mk-marks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.mk-mark {
  ${POSITIONED}
  --mk-mark-up: 1.18;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: var(--mk-r-xs);
  background: transparent;
  color: var(--mk-ink);
  cursor: pointer;
  pointer-events: auto;
  filter: drop-shadow(var(--mk-sh1));
  animation: mk-mark-in var(--mk-dur-mark-in) var(--mk-ease-entrance);
  transition:
    transform var(--mk-dur-fade) var(--mk-ease-surface),
    opacity var(--mk-dur-fade) var(--mk-ease-surface);
}

.mk-mark:hover,
.mk-mark:focus-visible,
.mk-mark[aria-pressed="true"] {
  transform: scale(var(--mk-mark-up));
  z-index: 3;
}

.mk-mark:active {
  transform: scale(calc(var(--mk-mark-up) * var(--mk-press)));
}

.mk-mark[aria-pressed="true"] {
  box-shadow:
    0 0 0 3px color-mix(in oklab, var(--mk-paint) 30%, transparent),
    var(--mk-sh3);
}

.mk-mark[aria-pressed="true"] .mk-leaf-halo {
  fill: var(--mk-fg);
  stroke: var(--mk-fg);
  stroke-width: 11;
}

.mk-mark-n {
  position: relative;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--mk-ink);
  transform: translateY(-1px);
}

.mk-mark[data-form="ring"] .mk-mark-n,
.mk-mark[data-form="dashed"] .mk-mark-n {
  color: var(--mk-paint);
}

.mk-mark[data-confidence="weak"] .mk-leaf-body {
  fill-opacity: 0.42;
}

.mk-mark[data-confidence="weak"] .mk-leaf-ring {
  fill-opacity: 1;
}

@keyframes mk-mark-in {
  from {
    opacity: 0;
    transform: translateY(var(--mk-rise-mark));
  }
}
`;
}

/** The ring, its label, and one rectangle per line of a passage. */
function ringCss(): string {
  return `
.mk-ring {
  ${POSITIONED}
  width: var(--mk-w);
  height: var(--mk-h);
  border-radius: var(--mk-r-sm);
  pointer-events: none;
  box-shadow:
    0 0 0 2px var(--mk-accent),
    0 0 0 7px color-mix(in oklab, var(--mk-accent) 20%, transparent);
  animation: mk-ring-in var(--mk-dur-fade) var(--mk-ease-surface);
  transition: opacity var(--mk-dur-fade) var(--mk-ease-surface);
}

.mk-ring[data-mk-moving] {
  will-change: transform;
}

.mk-ring[data-mk-state="hovered"] {
  box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--mk-accent) 60%, transparent);
}

.mk-ring-label {
  position: absolute;
  top: -21px;
  left: -2px;
  max-width: 240px;
  padding: 1px 7px;
  border-radius: var(--mk-r-xs) var(--mk-r-xs) var(--mk-r-xs) 0;
  background: var(--mk-accent);
  color: var(--mk-accent-ink);
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mk-ring-label[data-mk-below] {
  top: auto;
  bottom: -21px;
  border-radius: 0 var(--mk-r-xs) var(--mk-r-xs) var(--mk-r-xs);
}

.mk-ring-run {
  ${POSITIONED}
  width: var(--mk-w);
  height: var(--mk-h);
  border-radius: var(--mk-r-xs);
  background: color-mix(in oklab, var(--mk-accent) 20%, transparent);
}

@keyframes mk-ring-in {
  from {
    opacity: 0;
  }
}
`;
}

/** The same leaf at avatar size: provenance is the whole of the signal. */
function avatarCss(): string {
  return `
.mk-avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
}

.mk-avatar .mk-leaf-body {
  stroke-width: 2;
}

.mk-avatar-ini {
  position: relative;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--mk-ink);
  transform: translateY(-0.5px);
}

.mk-avatar[data-provenance="client"] .mk-leaf-body {
  fill-opacity: 0.4;
  stroke-width: 2.5;
}

.mk-avatar[data-provenance="client"] .mk-avatar-ini {
  color: var(--mk-fg);
}

.mk-avatar[data-provenance="guest"] .mk-leaf-dashed {
  stroke-width: 3.5;
  stroke-dasharray: 7 5;
}

.mk-avatar[data-provenance="guest"] .mk-avatar-ini {
  color: var(--mk-paint);
}
`;
}

/** Off-screen is hidden rather than unmounted, so nothing lands twice. */
function cullCss(): string {
  return `
.mk-mark[data-mk-off],
.mk-ring[data-mk-off] {
  visibility: hidden;
}
`;
}

/** Everything the marks add to the overlay's one stylesheet. */
export function marksCss(): string {
  return [paintCss(), leafCss(), markCss(), ringCss(), avatarCss(), cullCss()]
    .map((block) => block.trim())
    .join("\n\n");
}
