import { days, slots, type Lesson } from "@/lib/data";
import { courseSlots, minutesOf, timeAt } from "@/lib/settings";

export type Schedule = { name: string; grid: Lesson[][] };
export const emptyTimetable = (): Lesson[][] => days.map(() => slots.map(() => null));
export function parisTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return { day: ["Mon", "Tue", "Wed", "Thu", "Fri"].indexOf(part("weekday")), minutes: Number(part("hour")) * 60 + Number(part("minute")) };
}
export function currentLesson(grid: Lesson[][], date: Date, duration = 60) {
  const { day, minutes } = parisTime(date);
  const starts = courseSlots(duration);
  const index = starts.findIndex((slot) => {
    const [hour = 0, minute = 0] = slot.split(":").map(Number);
    const start = hour * 60 + minute;
    return minutes >= start && minutes < start + duration;
  });
  if (day < 0 || index < 0) return null;
  const lesson = grid[day]?.[index];
  const slot = starts[index];
  return lesson && slot ? { ...lesson, slot } : null;
}
export function slotEnd(slot: string, duration = 60) {
  return timeAt(minutesOf(slot) + duration);
}
export function currentTeacherClasses(schedules: Record<string, Schedule>, teacher: string, date: Date, duration = 60): string[] {
  return Object.entries(schedules)
    .filter(([, schedule]) => currentLesson(schedule.grid, date, duration)?.teacher === teacher)
    .map(([className]) => className);
}