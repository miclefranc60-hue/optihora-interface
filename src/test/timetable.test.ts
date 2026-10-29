import { describe, expect, it } from "vitest";
import { emptyTimetable, currentLesson, currentTeacherClasses } from "@/lib/timetable";

describe("Weekly timetables", () => {
  it("starts a new schedule with five empty days and eight slots", () => {
    const grid = emptyTimetable();
    expect(grid).toHaveLength(5);
    expect(grid.every((row) => row.length === 8 && row.every((item) => item === null))).toBe(true);
  });
  it("shows the current class subject from its schedule in Paris time", () => {
    const grid = emptyTimetable();
    const monday = grid[0];
    if (!monday) throw new Error("Missing Monday");
    monday[0] = { subject: "math", teacher: "Mme Laurent", room: "A101" };
    expect(currentLesson(grid, new Date("2026-10-26T07:30:00Z"))?.subject).toBe("math");
    expect(currentLesson(grid, new Date("2026-10-26T08:00:00Z"))).toBeNull();
  });
  it("shows no lesson on weekends or during lunch", () => {
    const grid = emptyTimetable();
    const monday = grid[0];
    if (!monday) throw new Error("Missing Monday");
    monday[3] = { subject: "fr", teacher: "M. Durand", room: "A101" };
    expect(currentLesson(grid, new Date("2026-10-26T11:30:00Z"))).toBeNull();
    expect(currentLesson(grid, new Date("2026-10-31T07:30:00Z"))).toBeNull();
  });
  it("finds the class currently taught by the requested teacher, not their assigned classes", () => {
    const grid = emptyTimetable();
    const monday = grid[0];
    if (!monday) throw new Error("Missing Monday");
    monday[0] = { subject: "math", teacher: "Mme Laurent", room: "A101" };
    const schedules = { "6eA": { name: "Semaine", grid } };
    expect(currentTeacherClasses(schedules, "Mme Laurent", new Date("2026-10-26T07:30:00Z"))).toEqual(["6eA"]);
    expect(currentTeacherClasses(schedules, "M. Durand", new Date("2026-10-26T07:30:00Z"))).toEqual([]);
  });
  it("returns no current class when the teacher is free, including at the configured lesson end", () => {
    const grid = emptyTimetable();
    const monday = grid[0];
    if (!monday) throw new Error("Missing Monday");
    monday[0] = { subject: "math", teacher: "Mme Laurent", room: "A101" };
    const schedules = { "6eA": { name: "Semaine", grid } };
    expect(currentTeacherClasses(schedules, "Mme Laurent", new Date("2026-10-26T07:44:00Z"), 45)).toEqual(["6eA"]);
    expect(currentTeacherClasses(schedules, "Mme Laurent", new Date("2026-10-26T07:45:00Z"), 45)).toEqual([]);
    expect(currentTeacherClasses(schedules, "Mme Laurent", new Date("2026-10-31T07:30:00Z"))).toEqual([]);
    expect(currentTeacherClasses({}, "Mme Laurent", new Date("2026-10-26T07:30:00Z"))).toEqual([]);
  });
});