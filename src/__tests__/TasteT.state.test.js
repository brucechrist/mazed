import { STALE_SWISS_THRESHOLD_MS, isSwissSessionStale, shouldFinalizeSwissStatus } from "../TasteT.jsx";

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

  describe("isSwissSessionStale", () => {
    const now = 1_700_000_000_000;

    test("returns false when swiss session is missing", () => {
      expect(isSwissSessionStale(null, now)).toBe(false);
    });

    test("returns false when there are no timestamps", () => {
      const swiss = { rounds: [], participants: [] };
      expect(isSwissSessionStale(swiss, now)).toBe(false);
    });

    test("returns false when activity is within the staleness window", () => {
      const recentActivity = now - STALE_SWISS_THRESHOLD_MS + 1_000;
      const swiss = {
        createdAt: now - STALE_SWISS_THRESHOLD_MS - 20_000,
        rounds: [
          {
            completedAt: now - STALE_SWISS_THRESHOLD_MS - 5_000,
            pairings: [{ timestamp: recentActivity - 500 }],
          },
        ],
        finalMatch: { timestamp: recentActivity },
      };
      expect(isSwissSessionStale(swiss, now)).toBe(false);
    });

    test("returns false when current time has not passed last activity", () => {
      const swiss = {
        createdAt: now,
        finalResult: { timestamp: now },
      };
      expect(isSwissSessionStale(swiss, now)).toBe(false);
    });

    test("returns true when last activity exceeds threshold", () => {
      const staleActivity = now - STALE_SWISS_THRESHOLD_MS - 1_000;
      const swiss = {
        createdAt: now - STALE_SWISS_THRESHOLD_MS - 50_000,
        rounds: [
          {
            completedAt: staleActivity,
            pairings: [{ timestamp: staleActivity }],
          },
        ],
      };
      expect(isSwissSessionStale(swiss, now)).toBe(true);
    });
  });
});
