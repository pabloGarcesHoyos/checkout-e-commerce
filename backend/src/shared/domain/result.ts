export class Ok<T, E = never> {
  readonly isOk = true;
  readonly isErr = false;

  constructor(readonly value: T) {}

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok(fn(this.value));
  }

  mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return new Ok(this.value);
  }

  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return fn(this.value);
  }

  unwrapOr(_fallback: T): T {
    return this.value;
  }
}

export class Err<E, T = never> {
  readonly isOk = false;
  readonly isErr = true;

  constructor(readonly error: E) {}

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Err(this.error);
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return new Err(fn(this.error));
  }

  andThen<U, F>(_fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return new Err(this.error);
  }

  unwrapOr(fallback: T): T {
    return fallback;
  }
}

export type Result<T, E> = Ok<T, E> | Err<E, T>;

export const ok = <T, E = never>(value: T): Result<T, E> => new Ok(value);
export const err = <E, T = never>(error: E): Result<T, E> => new Err(error);
