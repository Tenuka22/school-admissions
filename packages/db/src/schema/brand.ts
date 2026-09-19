import * as v from "valibot";

export type Brand<T, Name extends string> = T & {
  readonly __brand: Name;
};

export const brand = <T, Name extends string>() =>
  v.transform((value: T) => value as Brand<T, Name>);
