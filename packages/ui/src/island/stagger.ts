/**
 * How many rows stagger before the rest arrive together.
 *
 * The step and the cap are `--mk-stagger-step` and `--mk-stagger-cap`; this is
 * the cap divided by the step, so a list of thirty comments does not take a
 * second to appear. It is a count rather than a duration, which is why it is
 * here and not in the token table.
 */

/** Six rows at a 40ms step, which is the 240ms cap. */
export const STAGGER_ROWS = 6;
