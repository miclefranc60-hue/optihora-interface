import { describe, expect, it } from "vitest";
import { generateTimetable } from "@/lib/generator";
import { defaultSettings } from "@/lib/settings";

const teachers = ["math", "fr", "ang", "hg"].map((subject) => ({ name: `T-${subject}`, subject, hours: 18, classes: [] }));
const base = { className: "6eA", settings: defaultSettings, teachers, rooms: [{ name: "A1", type: "Salle de cours" as const, capacity: 30, occupancy: 0 }], constraints: [], schedules: {} };

describe("Génération automatique", () => {
  it("place exactly the requested hours per subject", () => {
    const { grid, unplaced } = generateTimetable({ ...base, hours: { math: 5, fr: 5, ang: 3, hg: 3 } });
    const count = (id: string) => grid.flat().filter((l) => l?.subject === id).length;
    expect([count("math"), count("fr"), count("ang"), count("hg")]).toEqual([5, 5, 3, 3]);
    expect(unplaced).toEqual({});
  });
  it("never schedules a subject more than 2 hours in a day", () => {
    for (let run = 0; run < 20; run++) {
      const { grid } = generateTimetable({ ...base, hours: { math: 10, fr: 10, ang: 5, hg: 5 } });
      for (const row of grid) for (const id of ["math", "fr", "ang", "hg"]) expect(row.filter((l) => l?.subject === id).length).toBeLessThanOrEqual(2);
    }
  });
  it("reports hours beyond the 2-per-day limit as unplaced", () => {
    expect(generateTimetable({ ...base, hours: { math: 12 } }).unplaced).toEqual({ math: 2 });
  });
  it("respects the configured number of courses per day", () => {
    const { grid } = generateTimetable({ ...base, settings: { ...defaultSettings, coursesPerDay: 4 }, hours: { math: 10, fr: 10 } });
    for (const row of grid) expect(row.slice(4).every((l) => l === null)).toBe(true);
  });
});
