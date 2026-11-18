import { describe, expect, it } from "vitest";
import { legatoChains, type LeadNote } from "./lead";

const n = (beat: number, dur: number, legato?: boolean): LeadNote => ({ midi: 60, beat, dur, ...(legato ? { legato } : {}) });

describe("ligado", () => {
  it("nota ligada colada na anterior continua a mesma voz", () => {
    expect(legatoChains([n(0, 1), n(1, 0.5, true), n(1.5, 0.5, true), n(2, 1)]).map((c) => c.length)).toEqual([3, 1]);
  });
  it("sem nota anterior colada, a ligada soa palhetada", () => {
    expect(legatoChains([n(0, 1), n(2, 1, true)]).map((c) => c.length)).toEqual([1, 1]);
    expect(legatoChains([n(0, 1, true)]).map((c) => c.length)).toEqual([1]);
  });
});
