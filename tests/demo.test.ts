import { sum } from "src/demo";

describe("demo", () => {
  test("sum-green", () => {
    expect(sum(1, 2)).toBe(3);
  });
  test("sum-red", () => {
    expect(sum(1, 2)).toBe(4);
  });
});
