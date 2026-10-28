import { describe, expect, it } from "vitest";
import { courseSlots, settingsSchema, teacherUnavailable, unavailabilitySchema, type Unavailability } from "@/lib/settings";
import { currentLesson, emptyTimetable, slotEnd } from "@/lib/timetable";

describe("Institution settings", () => {
  it("uses the entered 45-minute duration for starts, ends and current lessons", () => {
    expect(courseSlots(45)).toEqual(["08:00", "08:45", "09:30", "10:15", "13:30", "14:15", "15:00", "15:45"]);
    expect(slotEnd("08:00", 45)).toBe("08:45");
    const grid = emptyTimetable();
    const monday = grid[0];
    if (!monday) throw new Error("Missing Monday");
    monday[0] = { subject: "math", teacher: "Mme Laurent", room: "A101" };
    expect(currentLesson(grid, new Date("2026-10-26T07:44:00Z"), 45)?.subject).toBe("math");
    expect(currentLesson(grid, new Date("2026-10-26T07:45:00Z"), 45)).toBeNull();
  });
  it("retains the selected subjects and rejects an empty selection", () => {
    expect(settingsSchema.parse({ duration: 60, includedSubjects: ["math", "fr"] }).includedSubjects).toEqual(["math", "fr"]);
    expect(settingsSchema.safeParse({ duration: 60, includedSubjects: [] }).success).toBe(false);
  });
  it("blocks any overlap with a teacher's weekly unavailability but permits adjacent courses", () => {
    const constraints: Unavailability[] = [{ id: "1", teacher: "Mme Laurent", day: 0, start: "08:30", end: "10:00", reason: "" }];
    expect(teacherUnavailable(constraints, "Mme Laurent", 0, "08:00", 45)).toBe(true);
    expect(teacherUnavailable(constraints, "Mme Laurent", 0, "10:00", 45)).toBe(false);
    expect(teacherUnavailable(constraints, "Mme Laurent", 1, "08:00", 45)).toBe(false);
    expect(teacherUnavailable(constraints, "M. Durand", 0, "08:00", 45)).toBe(false);
  });
  it("rejects reversed unavailability hours", () => {
    expect(unavailabilitySchema.safeParse({ id: "1", teacher: "Mme Laurent", day: 0, start: "10:00", end: "08:00", reason: "" }).success).toBe(false);
  });
});