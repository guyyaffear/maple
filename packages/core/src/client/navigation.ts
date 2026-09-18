/**
 * Four layers that keep an unsent comment, none of which stops the reviewer.
 *
 * A modal that blocks a link is worse than a comment that comes back by
 * itself, so every layer here saves and gets out of the way. `beforeunload` is
 * attached only while a draft is dirty and removed the moment it is sent:
 * leaving it attached costs bfcache on every page in the host application, and
 * that regression gets blamed on Maple.
 */

/** What was about to take the page away. */
export type LeaveReason = "anchor" | "history" | "popstate" | "unload";

/** The window the guard attaches to. `window`, or a stub in a test. */
export interface NavigationView {
  readonly document: Document;
  readonly history: History;
  readonly location: { readonly href: string; readonly origin: string };
  addEventListener(type: string, listener: EventListener, options?: AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListener, options?: EventListenerOptions): void;
}

/** How the guard is wired to the draft it is protecting. */
export interface NavigationGuardOptions {
  readonly view: NavigationView;
  /** Writes whatever is pending, synchronously. Called on every layer. */
  save(): void;
  isDirty(): boolean;
  /** Called after the save, so a binding can say what was kept and where. */
  onLeave?(reason: LeaveReason): void;
  /**
   * Let the browser ask before a hard exit. Off by default: the draft is
   * already on disk, and the native dialog is still a dialog.
   */
  readonly confirmOnUnload?: boolean;
}

/** A guard that can be attached, told about dirtiness, and detached cleanly. */
export interface NavigationGuard {
  start(): void;
  /** Adds or removes `beforeunload` so it exists exactly while it is needed. */
  setDirty(dirty: boolean): void;
  stop(): void;
}

/** Builds the guard. Attaches nothing until `start()`. */
export function createNavigationGuard(options: NavigationGuardOptions): NavigationGuard {
  const { view } = options;
  let abort: AbortController | undefined;
  let attachedUnload = false;
  let restoreHistory: (() => void) | undefined;

  const leave = (reason: LeaveReason): void => {
    if (options.isDirty()) options.save();
    options.onLeave?.(reason);
  };

  const onUnload = (event: Event): void => {
    leave("unload");
    if (options.confirmOnUnload) event.preventDefault();
  };

  const setDirty = (dirty: boolean): void => {
    if (dirty === attachedUnload) return;
    attachedUnload = dirty;
    if (dirty) view.addEventListener("beforeunload", onUnload);
    else view.removeEventListener("beforeunload", onUnload);
  };

  return {
    start() {
      if (abort) return;
      abort = new AbortController();
      const { signal } = abort;

      view.document.addEventListener("click", (event) => onDocumentClick(view, event, leave), {
        capture: true,
        signal,
      });
      view.addEventListener("popstate", () => leave("popstate"), { signal });
      restoreHistory = patchHistory(view.history, () => leave("history"));
    },
    setDirty,
    stop() {
      abort?.abort();
      abort = undefined;
      restoreHistory?.();
      restoreHistory = undefined;
      setDirty(false);
    },
  };
}

/** A plain left click on a same-origin link, and nothing else, counts. */
function onDocumentClick(
  view: NavigationView,
  event: Event,
  leave: (reason: LeaveReason) => void,
): void {
  const click = event as MouseEvent;
  if (click.defaultPrevented || click.button !== 0) return;
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return;

  const link = linkIn(click);
  if (!link || link.hasAttribute("download")) return;
  if (link.target !== "" && link.target !== "_self") return;
  if (new URL(link.href, view.location.href).origin !== view.location.origin) return;

  leave("anchor");
}

/** The composed path, so a link inside a shadow root is still a link. */
function linkIn(event: MouseEvent): HTMLAnchorElement | undefined {
  for (const node of event.composedPath()) {
    if (node instanceof HTMLAnchorElement && node.href) return node;
  }
  return undefined;
}

/**
 * A single-page route change never unloads anything, so the only hook is the
 * two methods that perform it. They are patched to save, never to ask.
 */
function patchHistory(history: History, onChange: () => void): () => void {
  // Bound copies: the patch is removed by identity, so a library that patches
  // after Maple keeps its own wrapper rather than having it dropped.
  const original = {
    pushState: history.pushState.bind(history),
    replaceState: history.replaceState.bind(history),
  };

  const wrap = (name: "pushState" | "replaceState") =>
    function patched(...args: Parameters<History["pushState"]>): void {
      onChange();
      original[name](...args);
    };

  const installed = { pushState: wrap("pushState"), replaceState: wrap("replaceState") };
  history.pushState = installed.pushState;
  history.replaceState = installed.replaceState;

  return () => {
    if (history.pushState === installed.pushState) history.pushState = original.pushState;
    if (history.replaceState === installed.replaceState) {
      history.replaceState = original.replaceState;
    }
  };
}
