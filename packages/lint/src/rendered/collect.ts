/**
 * What the browser is asked for, and the only code in this package that runs
 * inside the page.
 *
 * It is one self-contained function with its helpers declared inside it,
 * because Playwright serialises it with `toString()` and a reference to an
 * import would not survive that. It collects and does not judge: every rule
 * runs in Node over the records, where it is a pure function with a test.
 */

/** One element's rendered state, as a rule needs to see it. */
export interface StyleRecord {
  /** `data-maple-src`, when the build ran the tagger. */
  readonly src?: string;
  /** A selector that finds the element again. */
  readonly selector: string;
  readonly tag: string;
  /** Trimmed text, capped, for a message that can quote what it is about. */
  readonly text: string;
  /** Whether a pointer is meant to hit it, which is what a touch target is. */
  readonly interactive: boolean;
  readonly color: string;
  /** The element's own background, which is the value a token rule judges. */
  readonly backgroundColor: string;
  /** The first opaque background at or above it, which is what contrast sees. */
  readonly backdrop: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly width: number;
  readonly height: number;
  readonly transitionProperty: string;
  readonly transitionDuration: string;
  readonly animationName: string;
  readonly animationDuration: string;
  /** Properties the running animation's keyframes declare, when they are readable. */
  readonly animationProperties: readonly string[];
}

/**
 * Reads every tagged element in the page. Returns plain data: Playwright can
 * only bring back what survives structured cloning, and a rule should not be
 * handed a live node it might read a second, different value from.
 */
export function collectStyleRecords(): StyleRecord[] {
  const INTERACTIVE_TAGS = ["a", "button", "input", "select", "summary", "textarea"];
  const INTERACTIVE_ROLES = ["button", "checkbox", "link", "menuitem", "switch", "tab"];
  const TEXT_CAP = 80;

  function isInteractive(element: Element): boolean {
    const tag = element.tagName.toLowerCase();
    if (INTERACTIVE_TAGS.includes(tag)) return true;
    const role = element.getAttribute("role");
    if (role !== null && INTERACTIVE_ROLES.includes(role)) return true;
    const tabIndex = element.getAttribute("tabindex");
    return tabIndex !== null && Number.parseInt(tabIndex, 10) >= 0;
  }

  function isOpaque(color: string): boolean {
    if (color === "transparent") return false;
    const alpha = /rgba?\([^)]*[,/]\s*([\d.]+)\s*\)/.exec(color);
    return alpha === null || Number.parseFloat(alpha[1]!) > 0;
  }

  function backdropOf(element: Element): string {
    let node: Element | null = element;
    while (node !== null) {
      const background = getComputedStyle(node).backgroundColor;
      if (isOpaque(background)) return background;
      node = node.parentElement;
    }
    return "rgb(255, 255, 255)";
  }

  function indexOf(element: Element): number {
    const siblings = [...(element.parentElement?.children ?? [])];
    return siblings.filter((sibling) => sibling.tagName === element.tagName).indexOf(element) + 1;
  }

  function selectorOf(element: Element): string {
    const steps: string[] = [];
    let node: Element | null = element;
    while (node !== null && node.tagName !== "HTML") {
      const tag = node.tagName.toLowerCase();
      steps.unshift(node.id === "" ? `${tag}:nth-of-type(${indexOf(node)})` : `#${node.id}`);
      if (node.id !== "") break;
      node = node.parentElement;
    }
    return steps.join(" > ");
  }

  function keyframeProperties(names: string): string[] {
    const wanted = names.split(",").map((name) => name.trim());
    if (wanted.every((name) => name === "none" || name === "")) return [];
    const found = new Set<string>();
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      collectKeyframes(rules, wanted, found);
    }
    return [...found];
  }

  function collectKeyframes(rules: CSSRuleList, wanted: string[], found: Set<string>): void {
    for (const rule of [...rules]) {
      if (!(rule instanceof CSSKeyframesRule) || !wanted.includes(rule.name)) continue;
      for (const frame of [...rule.cssRules]) {
        if (!(frame instanceof CSSKeyframeRule)) continue;
        for (const property of [...frame.style]) found.add(property);
      }
    }
  }

  function recordOf(element: Element): StyleRecord {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    const src = element.getAttribute("data-maple-src");
    return {
      ...(src === null ? {} : { src }),
      selector: selectorOf(element),
      tag: element.tagName.toLowerCase(),
      text: (element.textContent ?? "").trim().slice(0, TEXT_CAP),
      interactive: isInteractive(element),
      color: style.color,
      backgroundColor: style.backgroundColor,
      backdrop: backdropOf(element),
      fontSize: Number.parseFloat(style.fontSize),
      fontWeight: Number.parseFloat(style.fontWeight),
      width: box.width,
      height: box.height,
      transitionProperty: style.transitionProperty,
      transitionDuration: style.transitionDuration,
      animationName: style.animationName,
      animationDuration: style.animationDuration,
      animationProperties: keyframeProperties(style.animationName),
    };
  }

  return [...document.querySelectorAll("[data-maple-src]")].map(recordOf);
}
