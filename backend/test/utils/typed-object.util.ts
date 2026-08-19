// backend/test/utils/typed-object.util.ts
//
// TypeScript's Object.keys()/Object.entries() intentionally widen key types
// to `string` (a value can carry extra own-keys at runtime that its static
// type doesn't declare), so indexing back into a *specifically-typed* object
// with those keys trips TS7053 ("implicitly has an 'any' type") under
// strict mode — e.g. `snapshot[Object.keys(snapshot)[0]]`.
//
// These wrappers centralize the standard `as (keyof T)[]` idiom in one
// place. It's safe here specifically because `Object.keys`/`Object.entries`
// are guaranteed, by definition, to return only `obj`'s own enumerable
// string keys — the cast describes a guarantee the runtime already gives
// us, it doesn't assert anything unverified.

export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function typedEntries<T extends object>(
  obj: T,
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}
