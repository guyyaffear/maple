/**
 * Signing a reviewer in from a preview host.
 *
 * Everything here runs on the SDK route. A device code and a token are both
 * credentials, and neither belongs in a bundle the browser downloads.
 */

export { PENDING_COOKIE, readGitHubSession, SESSION_COOKIE } from "./cookie.js";

export type { GitHubSession, SessionCookieOptions } from "./cookie.js";

export { createDeviceFlow, DeviceFlowError } from "./device-flow.js";

export type {
  DeviceCode,
  DeviceExchange,
  DeviceFlow,
  DeviceFlowFailure,
  DeviceFlowOptions,
  DeviceToken,
} from "./device-flow.js";
