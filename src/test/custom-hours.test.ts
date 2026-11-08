import { describe, expect, it } from "vitest";
import { dayCourseSlots, defaultSettings, settingsSchema, type DayHours } from "@/lib/settings";
import { currentLesson, currentTeacherClasses, emptyTimetable } from "@/lib/timetable";
import { generateTimetable } from "@/lib/generator";
import { editTeacherRecords } from "@/lib/school-records";

const hours: DayHours = { start: "09:15", end: "16:15", lunch: true, lunchStart: "11:45", lunchEnd: "13:15" };
const settings = { ...defaultSettings, dayHours: Array.from({ length: 5 }, () => ({ ...hours })) };
describe("Personalized weekday hours", () => {
  it("uses freely chosen starts and skips lessons overlapping lunch or the day end", () => {
    expect(dayCourseSlots(settings, 0)).toEqual(["09:15", "10:15", "13:15", "14:15", "15:15"]);
  });
  it("supports distinct weekdays without a lunch break", () => {
    const customized = { ...settings, dayHours: settings.dayHours.map((day, i) => i === 2 ? { ...day, start: "07:30", end: "11:30", lunch: false } : day) };
    expect(dayCourseSlots(customized, 2)).toEqual(["07:30", "08:30", "09:30", "10:30"]);
    expect(dayCourseSlots(customized, 0)[0]).toBe("09:15");
  });
  it("rejects reversed day boundaries and out-of-day lunch", () => {
    expect(settingsSchema.safeParse({ ...settings, dayHours: settings.dayHours.map((day) => ({ ...day, end: "08:00" })) }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...settings, dayHours: settings.dayHours.map((day) => ({ ...day, lunchEnd: "18:00" })) }).success).toBe(false);
  });
  it("uses chosen times for live class and teacher status with half-open boundaries", () => {
    const grid = emptyTimetable();
    const monday = grid[0];
    if (!monday) throw new Error("Missing Monday");
    monday[0] = { subject: "math", teacher: "Mme Martin", room: "A1" };
    expect(currentLesson(grid, new Date("2026-11-09T08:15:00Z"), 60, settings)?.subject).toBe("math");
    expect(currentTeacherClasses({ "6eA": { name: "Week", grid } }, "Mme Martin", new Date("2026-11-09T08:15:00Z"), 60, settings)).toEqual(["6eA"]);
    expect(currentLesson(grid, new Date("2026-11-09T09:15:00Z"), 60, settings)).toBeNull();
  });
  it("keeps generated lessons inside each day's hours and respects teacher unavailability there", () => {
    const result = generateTimetable({ className: "6eA", hours: { math: 5 }, settings, teachers: [{ name: "Mme Martin", subject: "math", hours: 18, classes: [] }], rooms: [], constraints: [{ id: "c", teacher: "Mme Martin", day: 0, start: "09:15", end: "10:15", reason: "" }], schedules: {} });
    expect(result.grid[0]?.[0]).toBeNull();
    for (const row of result.grid) expect(row.slice(5)).toEqual([null, null, null]);
    expect(result.grid.flat().filter(Boolean).length).toBe(5);
  });
});
describe("Teacher editing", () => {
  const teacher = { name: "Mme Martin", subject: "math", hours: 18, classes: ["6eA"] };
  const grid = emptyTimetable();
  const monday = grid[0];
  if (monday) monday[0] = { subject: "math", teacher: teacher.name, room: "A1" };
  const state = { teachers: [teacher], classes: [{ name: "6eA", level: "Collège" as const, students: 26, hours: 26, mainTeacher: teacher.name }], constraints: [{ id: "c", teacher: teacher.name, day: 0, start: "12:00", end: "13:00", reason: "" }], schedules: { "6eA": { name: "Week", grid } } };
  it("updates details and preserves all name references and existing lessons", () => {
    const updated = editTeacherRecords(state, teacher.name, { ...teacher, name: "Mme Dupont", subject: "fr", hours: 20, classes: [] });
    expect(updated.teachers[0]).toEqual({ name: "Mme Dupont", subject: "fr", hours: 20, classes: [] });
    expect(updated.classes[0]?.mainTeacher).toBe("Mme Dupont");
    expect(updated.constraints[0]?.teacher).toBe("Mme Dupont");
    expect(updated.schedules["6eA"]?.grid[0]?.[0]).toEqual({ subject: "math", teacher: "Mme Dupont", room: "A1" });
    expect(state.teachers[0]?.name).toBe("Mme Martin");
  });
  it("rejects another teacher's name", () => {
    expect(() => editTeacherRecords({ ...state, teachers: [teacher, { ...teacher, name: "Mme Dupont" }] }, teacher.name, { ...teacher, name: "Mme Dupont" })).toThrow("Ce nom existe déjà");
  });
});