/**
 * The one error a classifier in this package throws.
 *
 * It is a plain `Error` subclass because every published entrypoint here is
 * Promises and structural types; an Effect failure never reaches a caller.
 */

/** A classifier call that did not produce an answer. */
export class ClassifierRequestError extends Error {
  override readonly name = "ClassifierRequestError";

  constructor(
    readonly connector: string,
    readonly operation: string,
    override readonly cause: unknown,
  ) {
    super(`Classifier "${connector}" could not ${operation}: ${describe(cause)}`);
  }
}

/** The shortest true sentence about a cause, whatever shape it arrived in. */
function describe(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return typeof cause === "string" ? cause : "the provider gave no reason.";
}
