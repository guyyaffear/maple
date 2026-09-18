/**
 * The composer's rules, kept out of `stylesheet.ts` so three parts can be
 * built at once without three agents editing one file.
 *
 * Every duration and easing here is a token, so reduced motion reaches the
 * panel with everything else. The sheet is not a variant: below
 * `SHEET_BREAKPOINT_PX` the same element takes `--mk-composer-w` at 100% and
 * `--mk-composer-r` from the base sheet, and slides up instead of across.
 */

import { SHEET_BREAKPOINT_PX } from "../tokens.js";

/** The width the sheet takes over at, as the media query spells it. */
const NARROW = `@media (max-width: ${SHEET_BREAKPOINT_PX - 1}px)`;

/**
 * The panel, its two detents as a sheet, and the five parts inside it.
 *
 * Interruptible throughout: state changes are transitions rather than
 * keyframes, so a close that interrupts an open reverses from where it is.
 */
export function composerCss(): string {
  return `
${shellCss()}

${partsCss()}

${controlCss()}

${NARROW} {
${sheetCss()}
}
`.trim();
}

function shellCss(): string {
  return `
.mk-composer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
  overflow-x: hidden;
  overflow-y: auto;
  width: var(--mk-composer-w);
  max-width: 100%;
  border-radius: var(--mk-composer-r);
  border-left: 1px solid var(--mk-line-firm);
  background: var(--mk-bg);
  box-shadow: var(--mk-sh3);
  opacity: 0;
  transform: translateX(var(--mk-shift-composer));
  pointer-events: none;
  transition:
    opacity var(--mk-dur-composer-close) var(--mk-ease-surface),
    transform var(--mk-dur-composer-close) var(--mk-ease-surface);
}

:host([data-mk-scheme="dark"]) .mk-composer {
  box-shadow: var(--mk-sh3), inset 0 1px 0 oklch(1 0 0 / 0.045);
}

.mk-composer[data-mk-open="true"] {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
  transition:
    opacity var(--mk-dur-composer-open) var(--mk-ease-surface),
    transform var(--mk-dur-composer-open) var(--mk-ease-surface);
}

.mk-composer[data-mk-moving="true"] {
  will-change: transform, opacity;
}

.mk-composer[data-mk-open="true"][data-mk-peek="true"] {
  opacity: 0.08;
  pointer-events: none;
  transition: opacity var(--mk-dur-fade) var(--mk-ease-surface);
}

.mk-composer-head {
  position: sticky;
  top: 0;
  z-index: 1;
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--mk-line);
  background: var(--mk-bg);
}

.mk-composer-fill {
  flex: 1 1 auto;
}

.mk-composer-row {
  flex: none;
  margin: 0 12px;
}

.mk-composer-foot {
  position: sticky;
  bottom: 0;
  margin-top: auto;
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-top: 1px solid var(--mk-line);
  background: var(--mk-sunk);
}

.mk-grab {
  display: none;
}
`.trim();
}

function partsCss(): string {
  return `
.mk-target {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.mk-target-on {
  font-size: 11.5px;
  color: var(--mk-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mk-target-on b {
  color: var(--mk-fg);
  font-weight: 600;
}

.mk-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  padding: 1px 7px 1px 5px;
  border-radius: 999px;
  border: 1px solid var(--mk-line);
  background: var(--mk-sunk);
  color: var(--mk-muted);
  font-size: 10.5px;
  font-weight: 650;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.mk-field {
  width: auto;
  min-height: 66px;
  padding: 8px 10px;
  resize: vertical;
  border: 1px solid var(--mk-line-firm);
  border-radius: var(--mk-r-sm);
  background: var(--mk-bg);
  color: var(--mk-fg);
  font-family: var(--mk-font);
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  transition:
    border-color var(--mk-dur-fade) var(--mk-ease-surface),
    box-shadow var(--mk-dur-fade) var(--mk-ease-surface);
}

.mk-field:focus {
  border-color: var(--mk-accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--mk-accent) 22%, transparent);
}

.mk-ctx {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 6px;
  padding: 5px 8px;
  border: 1px solid var(--mk-line);
  border-radius: var(--mk-r-xs);
  background: var(--mk-sunk);
  color: var(--mk-muted);
  font-family: var(--mk-mono);
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
}

.mk-ctx b {
  color: var(--mk-fg);
  font-weight: 600;
}

.mk-shots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mk-shots img {
  display: block;
  flex: none;
  width: 72px;
  height: 46px;
  object-fit: cover;
  border-radius: var(--mk-r-xs);
}

.mk-leave {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 3;
  max-width: calc(100% - 24px);
  padding: 11px 13px;
  border: 1px solid var(--mk-line-firm);
  border-radius: var(--mk-r);
  background: var(--mk-bg);
  box-shadow: var(--mk-sh3);
  opacity: 0;
  transform: translateX(-50%) scale(var(--mk-scale-island));
  pointer-events: none;
  transition:
    opacity var(--mk-dur-island-close) var(--mk-ease-surface),
    transform var(--mk-dur-island-close) var(--mk-ease-surface);
}

.mk-leave[data-mk-open="true"] {
  opacity: 1;
  transform: translateX(-50%) scale(1);
  pointer-events: auto;
  transition:
    opacity var(--mk-dur-island-open) var(--mk-ease-surface),
    transform var(--mk-dur-island-open) var(--mk-ease-surface);
}

.mk-leave-say {
  margin: 0 0 9px;
  font-size: 12.5px;
  font-weight: 600;
}

.mk-leave-ask {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
`.trim();
}

function controlCss(): string {
  return `
.mk-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: none;
  padding: 3px 8px;
  border: 1px solid var(--mk-line-firm);
  border-radius: var(--mk-r-sm);
  background: var(--mk-bg);
  color: var(--mk-fg);
  box-shadow: var(--mk-sh1);
  font-family: var(--mk-font);
  font-size: 11.5px;
  font-weight: 550;
  cursor: pointer;
  transition:
    background-color var(--mk-dur-fade) var(--mk-ease-surface),
    color var(--mk-dur-fade) var(--mk-ease-surface),
    filter var(--mk-dur-fade) var(--mk-ease-surface),
    transform var(--mk-dur-fade) var(--mk-ease-surface);
}

.mk-btn:hover {
  background: var(--mk-sunk);
}

.mk-btn[disabled] {
  opacity: 0.45;
  pointer-events: none;
}

.mk-btn-primary {
  border-color: transparent;
  background: var(--mk-accent);
  color: var(--mk-accent-ink);
}

.mk-btn-primary:hover {
  background: var(--mk-accent);
  filter: brightness(1.07);
}

.mk-btn-quiet {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
  color: var(--mk-muted);
}

.mk-btn-quiet:hover {
  background: var(--mk-sunk);
  color: var(--mk-fg);
}

.mk-shut {
  padding: 3px 7px;
  font-size: 12px;
  line-height: 1;
}
`.trim();
}

function sheetCss(): string {
  return `
  .mk-composer {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 78%;
    border-left: 0;
    border-top: 1px solid var(--mk-line-firm);
    transform: translateY(var(--mk-shift-composer));
  }

  .mk-composer[data-mk-open="true"] {
    transform: translateY(0);
  }

  .mk-composer[data-mk-detent="half"] {
    max-height: 46%;
  }

  .mk-composer-head {
    top: 11px;
  }

  .mk-grab {
    position: sticky;
    top: 0;
    z-index: 2;
    display: block;
    flex: none;
    width: 34px;
    height: 4px;
    margin: 7px auto 0;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: var(--mk-line-firm);
    cursor: grab;
    touch-action: none;
  }
`.trimEnd();
}
