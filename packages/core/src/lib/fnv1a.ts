/**
 * FNV-1a, the 32-bit variant.
 *
 * Maple needs one small non-cryptographic hash, to turn a reviewer's id into a
 * colour slot that is the same number on every machine and in every process.
 * That rules out anything seeded per run.
 *
 * This replaces a dependency on `@sindresorhus/fnv1a`: a published standard
 * (Fowler, Noll and Vo, 1991; public domain), checkable against its vectors.
 */

const OFFSET_BASIS = 0x811c9dc5;
const PRIME = 0x01000193;

/**
 * Hashes `value`'s UTF-8 bytes, returning an unsigned 32-bit integer.
 *
 * Bytes, not UTF-16 code units, so the result matches the reference
 * implementation for every input rather than only for ASCII.
 */
export function fnv1a32(value: string): number {
  const bytes = new TextEncoder().encode(value);

  let hash = OFFSET_BASIS;
  for (const byte of bytes) {
    hash ^= byte;
    // Math.imul keeps the multiply in 32 bits; `*` would lose precision.
    hash = Math.imul(hash, PRIME);
  }

  return hash >>> 0;
}
