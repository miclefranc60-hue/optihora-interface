import { describe, expect, it } from "vitest";
import { emptyTimetable, currentLesson } from "@/lib/timetable";

describe("Weekly timetables", () => {
  it("starts a new schedule with five empty days and eight slots", () => {
    const grid = emptyTimetable();
    expect(grid).toHaveLength(5);
    expect(grid.every((row) => row.length === 8 && row.every((item) => item === null))).toBe(true);
  });
  it("shows the current class subject from its schedule in Paris time", () => {
    const grid = emptyTimetable();
    grid[0][0] = { subject: "math", teacher: "Mme Laurent", room: "A101" };
    expect(currentLesson(grid, new Date("2026-10-26T07:30:00Z"))?.subject).toBe("math");
    expect(currentLesson(grid, new Date("2026-10-26T08:00:00Z"))).toBeNull();
  });
  it("shows no lesson on weekends or during lunch", () => {
    const grid = emptyTimetable();
    grid[0][3] = { subject: "fr", teacher: "M. Durand", room: "A101" };
    expect(currentLesson(grid, new Date("2026-10-26T11:30:00Z"))).toBeNull();
    expect(currentLesson(grid, new Date("2026-10-31T07:30:00Z"))).toBeNull();
  });
});