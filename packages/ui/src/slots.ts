/**
 * The ten reviewer colours, and the only supported way to apply one.
 *
 * Hue is constant across schemes and lightness alternates between neighbours,
 * so two adjacent slots stay apart under deuteranopia. A slot reaches an
 * element as two custom properties set with `setProperty`; a generated rule per
 * reviewer would grow the stylesheet with the team and break the CSP claim.
 */

/** Lightness, chroma and hue for one slot. */
interface SlotColor {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

const PALETTE: readonly SlotColor[] = [
  { l: 0.63, c: 0.13, h: 22 },
  { l: 0.77, c: 0.12, h: 62 },
  { l: 0.62, c: 0.12, h: 104 },
  { l: 0.76, c: 0.11, h: 146 },
  { l: 0.61, c: 0.1, h: 182 },
  { l: 0.75, c: 0.1, h: 214 },
  { l: 0.62, c: 0.13, h: 252 },
  { l: 0.76, c: 0.11, h: 288 },
  { l: 0.61, c: 0.13, h: 320 },
  { l: 0.75, c: 0.12, h: 350 },
];

/** Above this lightness a slot takes dark ink; below it, light. */
const INK_ABOVE = 0.68;

/** How many slots there are. `CommentAuthor.colorSlot` is a number under this. */
export const REVIEWER_SLOT_COUNT = PALETTE.length;

function at(slot: number): SlotColor {
  const index = ((Math.trunc(slot) % PALETTE.length) + PALETTE.length) % PALETTE.length;
  return PALETTE[index] ?? PALETTE[0]!;
}

/** The reviewer's colour. Out-of-range and negative slots wrap rather than throw. */
export function slotColor(slot: number): string {
  const { l, c, h } = at(slot);
  return `oklch(${l} ${c} ${h})`;
}

/** What reads on top of {@link slotColor} at the same hue. */
export function slotInk(slot: number): string {
  const { l, h } = at(slot);
  return l > INK_ABOVE ? `oklch(0.22 0.03 ${h})` : `oklch(0.99 0.01 ${h})`;
}

/** What `applyReviewerSlot` writes, and the only two runtime colour tokens. */
export const SLOT_PROPERTY = "--mk-slot";
export const SLOT_INK_PROPERTY = "--mk-slot-ink";

/**
 * Paints one element in a reviewer's colour. Two `setProperty` calls, never a
 * rule and never `cssText`, which is the one CSSOM call CSP checks.
 */
export function applyReviewerSlot(element: ElementCSSInlineStyle, slot: number): void {
  element.style.setProperty(SLOT_PROPERTY, slotColor(slot));
  element.style.setProperty(SLOT_INK_PROPERTY, slotInk(slot));
}
