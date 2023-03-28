import { Equal, Expect, testTypes } from "./types";

type Operator = (...args: any[]) => any;
type Operators = Record<string, Operator>;

type OperatorFor<T> = (arg: T, ...args: any[]) => any;

type NestedSequenceOperator<T extends Operator, TReturn> = T extends (arg: any, ...args: infer TParams) => any
  ? (...args: TParams) => TReturn
  : never;

type RootSequenceOperator<T extends Operator, TReturn> = T extends (...args: infer TParams) => any
  ? (...args: TParams) => TReturn
  : never;

interface SequenceWithResult<TValue> {
  calculate: () => TValue;
}

type NestedSequence<T extends Operators, TValue> = {
  [K in keyof T as T[K] extends OperatorFor<TValue> ? K : never]: NestedSequenceOperator<
    T[K],
    NestedSequence<T, ReturnType<T[K]>>
  >;
} & SequenceWithResult<TValue>;

type RootSequence<T extends Operators> = {
  [K in keyof T]: RootSequenceOperator<T[K], NestedSequence<T, ReturnType<T[K]>>>;
};

type Sequence<T extends Operators> = RootSequence<T>;

function sequence<T extends Operators>(operators: T): Sequence<T> {
  class _NestedSequence implements SequenceWithResult<unknown> {
    public constructor(public value: unknown) {}

    public calculate(): unknown {
      return this.value;
    }
  }

  for (const k in operators) {
    (_NestedSequence.prototype as any)[k] = function (...args: any[]) {
      return new _NestedSequence(operators[k](this.value, ...args));
    };
  }

  class _RootSequence {}

  for (const k in operators) {
    (_RootSequence.prototype as any)[k] = function (...args: any[]) {
      return new _NestedSequence(operators[k](...args));
    };
  }

  return new _RootSequence() as Sequence<T>;
}

const add = (a: number, b: number) => a + b;
const double = (a: number) => a * 2;
const toBoolean = (x: number) => Boolean(x);
const negate = (x: boolean) => !x;
const toNumber = (x: boolean) => Number(x);

describe("sequence", () => {
  test("simple", () => {
    const s = sequence({ add, double });
    const r = s.add(2, 4).add(10).calculate();
    expect(r).toBe(16);
  });
  test("single", () => {
    const s = sequence({ add, double });
    expect(s.add(4, 5).add(5).add(4).add(7).double().double().calculate()).toBe(100);
  });
  test("types", () => {
    const s = sequence({ add, double, toBoolean, negate, toNumber });
    const r = s.add(2, 4).add(-6).toBoolean().negate().toNumber().double().calculate();
    expect(r).toBe(2);
  });
  test("boolean", () => {
    const s = sequence({ add, double, toBoolean, negate, toNumber });
    const r = s.add(2, 4).toBoolean().calculate();
    expect(r).toBe(true);
  });
  test("reuse root", () => {
    const s = sequence({ add, double });
    expect(s.add(3, 4).calculate()).toBe(7);
    expect(s.add(1, 2).calculate()).toBe(3);
  });
  test("reuse nested", () => {
    const s = sequence({ add, double });

    const s1 = s.add(1, 2);
    expect(s1.calculate()).toBe(3);
    expect(s1.double().calculate()).toBe(6);
    expect(s1.add(1).calculate()).toBe(4);
    expect(s1.calculate()).toBe(3);

    const s2 = s1.add(5);
    expect(s2.double().calculate()).toBe(16);
    expect(s2.add(3).calculate()).toBe(11);
    expect(s2.calculate()).toBe(8);
    expect(s1.calculate()).toBe(3);
  });
});

const sn = (s: string, n: number): string => s + n;
const s1 = sequence({ sn });
testTypes<
  "simple",
  [
    Expect<Equal<keyof typeof s1, "sn">>,
    Expect<Equal<Parameters<(typeof s1)["sn"]>, [string, number]>>,
    Expect<Equal<keyof ReturnType<(typeof s1)["sn"]>, "sn" | "calculate">>,
    Expect<Equal<Parameters<ReturnType<(typeof s1)["sn"]>["sn"]>, [number]>>,
    Expect<Equal<ReturnType<(typeof s1)["sn"]>["calculate"], () => string>>
  ]
>();

const s2 = sequence({ double, toBoolean, toNumber });
testTypes<
  "many types",
  [
    Expect<Equal<keyof typeof s2, "double" | "toBoolean" | "toNumber">>,
    Expect<Equal<Parameters<(typeof s2)["double"]>, [number]>>,
    Expect<Equal<Parameters<(typeof s2)["toBoolean"]>, [number]>>,
    Expect<Equal<Parameters<(typeof s2)["toNumber"]>, [boolean]>>,

    Expect<Equal<keyof ReturnType<(typeof s2)["double"]>, "double" | "toBoolean" | "calculate">>,
    Expect<Equal<Parameters<ReturnType<(typeof s2)["double"]>["double"]>, []>>,
    Expect<Equal<Parameters<ReturnType<(typeof s2)["double"]>["toBoolean"]>, []>>,
    Expect<Equal<ReturnType<(typeof s2)["double"]>["calculate"], () => number>>,
    Expect<Equal<keyof ReturnType<(typeof s2)["toBoolean"]>, "toNumber" | "calculate">>,
    Expect<Equal<Parameters<ReturnType<(typeof s2)["toBoolean"]>["toNumber"]>, []>>,
    Expect<Equal<ReturnType<(typeof s2)["toBoolean"]>["calculate"], () => boolean>>
  ]
>();

const fsn = (s: string, n: number): number => s.length + n;
const fnsb = (n: number, s: string, b: boolean): string => s + n + b;
const s3 = sequence({ fsn, fnsb });
testTypes<
  "many args",
  [
    Expect<Equal<keyof typeof s3, "fsn" | "fnsb">>,
    Expect<Equal<Parameters<(typeof s3)["fsn"]>, [string, number]>>,
    Expect<Equal<Parameters<(typeof s3)["fnsb"]>, [number, string, boolean]>>,

    Expect<Equal<keyof ReturnType<(typeof s3)["fsn"]>, "fnsb" | "calculate">>,
    Expect<Equal<Parameters<ReturnType<(typeof s3)["fsn"]>["fnsb"]>, [string, boolean]>>,
    Expect<Equal<ReturnType<(typeof s3)["fsn"]>["calculate"], () => number>>,
    Expect<Equal<keyof ReturnType<(typeof s3)["fnsb"]>, "fsn" | "calculate">>,
    Expect<Equal<Parameters<ReturnType<(typeof s3)["fnsb"]>["fsn"]>, [number]>>,
    Expect<Equal<ReturnType<(typeof s3)["fnsb"]>["calculate"], () => string>>
  ]
>();

type Nested1 = ReturnType<(typeof s3)["fsn"]>;
type Nested2 = ReturnType<Nested1["fnsb"]>;
type Nested3 = ReturnType<Nested2["fsn"]>;
type Nested4 = ReturnType<Nested3["fnsb"]>;
testTypes<"recursive", [Expect<Equal<Nested1, Nested3>>, Expect<Equal<Nested2, Nested4>>]>();
