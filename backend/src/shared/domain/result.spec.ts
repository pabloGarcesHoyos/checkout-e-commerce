import { err, ok } from './result';

describe('Result', () => {
  it('maps the value of an Ok', () => {
    const result = ok<number, string>(2).map((value) => value * 2);
    expect(result.isOk).toBe(true);
    expect(result.unwrapOr(0)).toBe(4);
  });

  it('does not map the value of an Err', () => {
    const result = err<string, number>('failure').map(
      (value: number) => value * 2,
    );
    expect(result.isErr).toBe(true);
    expect(result.unwrapOr(0)).toBe(0);
  });

  it('mapErr transforms the error of an Err', () => {
    const result = err<string, number>('failure').mapErr((error) =>
      error.toUpperCase(),
    );
    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error).toBe('FAILURE');
    }
  });

  it('mapErr is a no-op on Ok', () => {
    const result = ok<number, string>(5).mapErr((error) => error.toUpperCase());
    expect(result.unwrapOr(0)).toBe(5);
  });

  it('andThen chains Ok results', () => {
    const result = ok<number, string>(2).andThen((value) =>
      ok<number, string>(value + 1),
    );
    expect(result.unwrapOr(0)).toBe(3);
  });

  it('andThen short-circuits on Err', () => {
    const result = err<string, number>('failure').andThen((value: number) =>
      ok<number, string>(value + 1),
    );
    expect(result.isErr).toBe(true);
  });

  it('unwrapOr returns the fallback for Err', () => {
    expect(err<string, number>('failure').unwrapOr(99)).toBe(99);
  });
});
