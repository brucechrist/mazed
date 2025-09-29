import { shouldFinalizeSwissStatus } from "../TasteT.jsx";

describe("TasteT Swiss utilities", () => {
  test("should finalize only awaiting-finish or completed states", () => {
    expect(shouldFinalizeSwissStatus("awaiting-finish")).toBe(true);
    expect(shouldFinalizeSwissStatus("completed")).toBe(true);
    expect(shouldFinalizeSwissStatus("between-rounds")).toBe(false);
    expect(shouldFinalizeSwissStatus("in-progress")).toBe(false);
    expect(shouldFinalizeSwissStatus("finals")).toBe(false);
    expect(shouldFinalizeSwissStatus(undefined)).toBe(false);
    expect(shouldFinalizeSwissStatus(null)).toBe(false);
  });
});
