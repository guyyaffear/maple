/**
 * How one icon is built. One module per icon, never a record.
 *
 * A record is retained whole the moment anything indexes it dynamically, and
 * the bundle budget cannot survive shipping eight icons to a part that draws
 * one. Every icon is the same 16-unit box drawn in `currentColor`, so it takes
 * the colour of whatever it sits in and needs no props to do it.
 */

import { createElement, forwardRef } from "react";

import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

/** Icons are drawn at 13px unless a part asks for another size. */
export const ICON_SIZE = 13;

/** Anything an `<svg>` takes, plus the one size the parts vary. */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  readonly size?: number;
}

/** What `createIcon` returns: a forwarding component, ref and className included. */
export type IconComponent = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

/** The path, and the two things that vary between the eight. */
export interface IconSpec {
  readonly d: string;
  readonly strokeWidth?: number;
  readonly dashArray?: string;
}

/** Builds one icon. Called once per module, so a bundler can drop the unused. */
export function createIcon(spec: IconSpec): IconComponent {
  return forwardRef<SVGSVGElement, IconProps>(function Icon(props, ref) {
    const { size = ICON_SIZE, ...rest } = props;

    return createElement(
      "svg",
      {
        "aria-hidden": true,
        focusable: false,
        ...rest,
        ref,
        width: size,
        height: size,
        viewBox: "0 0 16 16",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: spec.strokeWidth ?? 1.4,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
      createElement("path", {
        d: spec.d,
        ...(spec.dashArray === undefined ? {} : { strokeDasharray: spec.dashArray }),
      }),
    );
  });
}
