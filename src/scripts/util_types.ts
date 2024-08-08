// type Grow<T, A extends Array<T>> =
//   ((x: T, ...xs: A) => void) extends ((...a: infer X) => void) ? X : never;
// type GrowToSize<T, A extends Array<T>, N extends number> =
//   { 0: A, 1: GrowToSize<T, Grow<T, A>, N> }[A['length'] extends N ? 0 : 1];
//
// export type FixedArray<T, N extends number> = GrowToSize<T, [], N>;
type GrowToSize<T, N extends number, A extends T[]> =
  A['length'] extends N ? A : GrowToSize<T, N, [...A, T]>;

export type FixedArray<T, N extends number> = GrowToSize<T, N, []>;
