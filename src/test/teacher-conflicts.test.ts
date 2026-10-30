import { describe, expect, it } from "vitest";
import { emptyTimetable, teacherScheduleConflicts, updateScheduleLesson } from "@/lib/timetable";

const lesson = { teacher: "Mme Laurent", subject: "math", room: "A101" };
function schedulesWithLesson() {
  const schedules = { "6eA": { name: "6eA", grid: emptyTimetable() }, "5eB": { name: "5eB", grid: emptyTimetable() } };
  return updateScheduleLesson(schedules, "6eA", 0, 0, lesson);
}
describe("One class per teacher at a time", () => {
  it("allows simultaneous classes only when permission is enabled and flags them again when disabled", () => {
    const schedules = updateScheduleLesson(schedulesWithLesson(), "5eB", 0, 0, lesson, true);
    expect(schedules["5eB"]?.grid[0]?.[0]).toEqual(lesson);
    expect(schedules["6eA"]?.grid[0]?.[0]).toEqual(lesson);
    expect(teacherScheduleConflicts(schedules, "5eB", lesson.teacher, 0, 0, true)).toEqual([]);
    expect(teacherScheduleConflicts(schedules, "5eB", lesson.teacher, 0, 0, false)).toEqual(["6eA"]);
    expect(() => updateScheduleLesson(schedules, "5eB", 0, 0, lesson, false)).toThrow("6eA");
  });
  it("rejects a simultaneous lesson in a second class without changing either grid", () => {
    const schedules = schedulesWithLesson();
    expect(() => updateScheduleLesson(schedules, "5eB", 0, 0, lesson)).toThrow("6eA");
    expect(schedules["5eB"]?.grid[0]?.[0]).toBeNull();
    expect(schedules["6eA"]?.grid[0]?.[0]).toEqual(lesson);
  });
  it("allows the same teacher in another slot or on another day", () => {
    const schedules = schedulesWithLesson();
    expect(updateScheduleLesson(schedules, "5eB", 0, 1, lesson)["5eB"]?.grid[0]?.[1]).toEqual(lesson);
    expect(updateScheduleLesson(schedules, "5eB", 1, 0, lesson)["5eB"]?.grid[1]?.[0]).toEqual(lesson);
  });
  it("allows editing the teacher's own lesson and another teacher at the same time", () => {
    const schedules = schedulesWithLesson();
    expect(updateScheduleLesson(schedules, "6eA", 0, 0, { ...lesson, room: "A102" })["6eA"]?.grid[0]?.[0]?.room).toBe("A102");
    expect(updateScheduleLesson(schedules, "5eB", 0, 0, { ...lesson, teacher: "M. Durand" })["5eB"]?.grid[0]?.[0]?.teacher).toBe("M. Durand");
  });
  it("releases the teacher after a lesson is deleted", () => {
    const schedules = updateScheduleLesson(schedulesWithLesson(), "6eA", 0, 0, null);
    expect(updateScheduleLesson(schedules, "5eB", 0, 0, lesson)["5eB"]?.grid[0]?.[0]).toEqual(lesson);
  });
  it("flags pre-existing simultaneous lessons without deleting them", () => {
    const schedules = schedulesWithLesson();
    const row = schedules["5eB"]?.grid[0];
    if (!row) throw new Error("Missing Monday");
    row[0] = lesson;
    expect(teacherScheduleConflicts(schedules, "6eA", "Mme Laurent", 0, 0)).toEqual(["5eB"]);
    expect(schedules["5eB"]?.grid[0]?.[0]).toEqual(lesson);
    expect(updateScheduleLesson(schedules, "5eB", 0, 0, null)["5eB"]?.grid[0]?.[0]).toBeNull();
  });
});