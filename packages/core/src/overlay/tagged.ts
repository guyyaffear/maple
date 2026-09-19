/**
 * Whether this build ran the tagger, asked of the page itself.
 *
 * The two ways a Next config gets tagging wrong both end the same way: the
 * page renders, nothing throws, and every comment says "this page" with no
 * component name and no file. The build cannot tell anyone, because from the
 * build's side nothing happened. The page can: if no element anywhere carries
 * `data-maple-src`, the tagger did not run on what produced it.
 */

import { SOURCE_ATTRIBUTE } from "../tagger/attributes.js";

/**
 * True when anything on the page carries a tagger attribute.
 *
 * One `querySelector`, so it costs nothing to ask again after a route change.
 * A production build is untagged on purpose and this says so too; what a
 * caller does about it is the caller's, and only a preview should care.
 */
export function pageIsTagged(root: ParentNode): boolean {
  return root.querySelector(`[${SOURCE_ATTRIBUTE}]`) !== null;
}
