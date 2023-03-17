/*
type Operator = (...args: number[]) => number;
type Operators = Record<string, Operator>;

type NestedSequenceOperator<T extends Operator, TReturn> = T extends (arg: any, ...args: infer TParams) => any
  ? (...args: TParams) => TReturn
  : never;

type RootSequenceOperator<T extends Operator, TReturn> = T extends (...args: infer TParams) => any
  ? (...args: TParams) => TReturn
  : never;


type NestedSequence<T extends Operators> = {
  [K in keyof T]: NestedSequenceOperator<T[K], NestedSequence<T>>
} & {
  calculate: () => number;
}

type RootSequence<T extends Operators> = {
  [K in keyof T]: RootSequenceOperator<T[K], NestedSequence<T>>;
}

type Sequence<T extends Operators> = RootSequence<T>
*/

type Operator = (...args: any[]) => any;
type Operators = Record<string, Operator>;

type OperatorFor<T> = (arg: T, ...args: any[]) => any;

type NestedSequenceOperator<T extends Operator, TReturn> = T extends (arg: any, ...args: infer TParams) => any
  ? (...args: TParams) => TReturn
  : never;

type RootSequenceOperator<T extends Operator, TReturn> = T extends (...args: infer TParams) => any
  ? (...args: TParams) => TReturn
  : never;

type NestedSequence<T extends Operators, TValue> = {
  [K in keyof T as T[K] extends OperatorFor<TValue> ? K : never]: NestedSequenceOperator<
    T[K],
    NestedSequence<T, ReturnType<T[K]>>
  >;
} & {
  calculate: () => TValue;
};

type RootSequence<T extends Operators> = {
  [K in keyof T]: RootSequenceOperator<T[K], NestedSequence<T, ReturnType<T[K]>>>;
};

type Sequence<T extends Operators> = RootSequence<T>;

function sequence<T extends Operators>(operators: T): Sequence<T> {
  class _NestedSequence {
    public constructor(public value: number) {}

    public calculate(): number {
      return this.value;
    }
  }

  for (const k in operators) {
    (_NestedSequence.prototype as any)[k] = function (...args: any[]) {
      return new _NestedSequence(operators[k](this.value, ...args) as any);
    };
  }

  class _RootSequence {}

  for (const k in operators) {
    (_RootSequence.prototype as any)[k] = function (...args: any[]) {
      return new _NestedSequence(operators[k](...args) as any);
    };
  }

  return new _RootSequence() as Sequence<T>;
}

const add = (a: number, b: number) => a + b;
const double = (a: number) => a * 2;
const toBool = (x: number) => Boolean(x);
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
    const s = sequence({ add, double, toBool, negate, toNumber });
    const r = s.add(2, 4).add(-6).toBool().negate().toNumber().double().calculate();
    expect(r).toBe(2);
  });
  test("boolean", () => {
    const s = sequence({ add, double, toBool, negate, toNumber });
    const r = s.add(2, 4).toBool().calculate();
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
