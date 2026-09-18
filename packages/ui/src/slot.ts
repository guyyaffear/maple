/**
 * `asChild`: hand a part your own element and keep its focus ring.
 *
 * Every part in this package takes `asChild`, so an application can pass its
 * own button to a pick control and keep the analytics, the focus ring and the
 * class names it already has. The part's props and the child's are merged
 * rather than one winning: handlers compose, `className` and `style` merge, and
 * both refs are called.
 */

import { cloneElement, forwardRef, isValidElement } from "react";

import type { HTMLAttributes, ReactElement, ReactNode, Ref } from "react";

/** Props of unknown shape, which is what a caller's element has. */
type AnyProps = Record<string, unknown>;

type Handler = (...args: readonly unknown[]) => unknown;

/** Every part accepts this, and none of them accepts a visual variant. */
export interface AsChildProps {
  /** Render the single child instead of the part's own element. */
  readonly asChild?: boolean;
}

/** What `<Slot>` renders into: the part's props, over one element child. */
export interface SlotProps extends HTMLAttributes<HTMLElement> {
  readonly children?: ReactNode;
}

/** Thrown when `asChild` was given something other than one element. */
export class AsChildError extends Error {
  override readonly name = "AsChildError";

  constructor() {
    super("asChild needs exactly one React element as its child.");
  }
}

/** Calls every ref it was given with the same node. */
export function composeRefs<T>(...refs: readonly (Ref<T> | undefined)[]): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}

function isHandler(key: string): boolean {
  return key.startsWith("on") && key.length > 2 && key[2] === key[2]?.toUpperCase();
}

function composeHandlers(slot: unknown, child: unknown): unknown {
  if (typeof slot !== "function" || typeof child !== "function") return child ?? slot;
  return (...args: readonly unknown[]) => {
    (slot as Handler)(...args);
    (child as Handler)(...args);
  };
}

function mergeValue(key: string, slot: unknown, child: unknown): unknown {
  if (isHandler(key)) return composeHandlers(slot, child);
  if (key === "className") return [slot, child].filter(Boolean).join(" ") || undefined;
  if (key === "style") return { ...(slot as object), ...(child as object) };
  return child ?? slot;
}

/** The part's props first, the child's over them, merging the three that merge. */
export function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps };
  for (const key of Object.keys(childProps)) {
    merged[key] = mergeValue(key, slotProps[key], childProps[key]);
  }
  return merged;
}

/** React 19 carries a child's ref on its props; 18 carries it on the element. */
function refOf(child: ReactElement<AnyProps>): Ref<unknown> | undefined {
  const onElement = (child as { ref?: Ref<unknown> }).ref;
  return (child.props["ref"] as Ref<unknown> | undefined) ?? onElement;
}

/**
 * Renders its one element child with the part's props merged in. Parts pick it
 * with `const Element = asChild ? Slot : "button"` and change nothing else.
 */
export const Slot = /** @__PURE__ */ forwardRef<HTMLElement, SlotProps>(function Slot(props, ref) {
  const { children, ...slotProps } = props;
  if (!isValidElement(children)) throw new AsChildError();

  const child = children as ReactElement<AnyProps>;
  const merged = mergeProps(slotProps, child.props);
  merged["ref"] = composeRefs<unknown>(ref, refOf(child));

  return cloneElement(child, merged);
});
