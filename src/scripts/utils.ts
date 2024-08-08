/**
 * Adds two numbers and returns the result modulo a given maximum value.
 *
 * @param {number} a - The first number to add.
 * @param {number} b - The second number to add.
 * @param {number} max - The maximum value for the modulo operation.
 * @returns {number} The result of (a + b) % max.
 */
export function overflowingAdd(a: number, b: number, max: number): number {
  return (a + b) % max;
}

/**
 * Memoizes a function, caching its result based on the comparison of its arguments.
 *
 * @template P - The type of the function's parameters.
 * @template R - The type of the function's return value.
 * @template A - The type of the function to be memoized.
 * @param {A} fn - The function to memoize.
 * @param {(arg0: P, arg1: P) => boolean} cmp - The comparison function to determine if the cached result should be used.
 * @returns {(...args: P) => R} The memoized function.
 */
export function memoize<P extends Array<unknown>, R, A extends (...args: P) => R>(fn: A, cmp: (arg0: P, arg1: P) => boolean) {
  let cached_result: R | undefined = undefined;
  let cached_params: P | undefined = undefined;
  return (...args: P): R => {
    if (cached_params && cached_result && (cmp(args, cached_params))) {
      return cached_result;
    }
    cached_params = args;
    cached_result = fn(...args);
    return cached_result;
  };
}

/**
 * Returns the first value from a generator that matches the filter function, or a default value if no match is found.
 *
 * @template T - The type of the values generated.
 * @param {Generator<T>} gen - The generator to retrieve values from.
 * @param {T} defaultVal - The default value to return if no match is found.
 * @param {(arg1: T) => boolean} [filter] - The optional filter function to apply to the generator's values.
 * @returns {T} The first matching value or the default value.
 */
export function firstOrDefault<T>(gen: Generator<T>, defaultVal: T, filter?: (arg1: T) => boolean) {
  const n = first(gen, undefined, filter);
  return n ?? defaultVal;
}

/**
 * Returns the first value from a generator that matches the filter function, or undefined if no match is found.
 *
 * @template T - The type of the values generated.
 * @template R - The type of the generator's return value.
 * @param {Generator<T, R>} gen - The generator to retrieve values from.
 * @param {R} f - The return value to pass to the generator's return method.
 * @param {(arg1: T) => boolean} [filter] - The optional filter function to apply to the generator's values.
 * @returns {T | undefined} The first matching value or undefined.
 */
export function first<T, R>(gen: Generator<T, R>, f: R, filter?: (arg1: T) => boolean): T | undefined {
  let firstVal: T | undefined;
  while (firstVal === undefined) {
    const next = gen.next();
    if (!next.done) {
      if (filter !== undefined) {
        if (filter(next.value)) {
          firstVal = next.value;
          gen.return(f);
        } else {
          continue;
        }
      }
      firstVal = next.value;
      gen.return(f);
    } else {
      return undefined;
    }
  }
  return firstVal;
}
