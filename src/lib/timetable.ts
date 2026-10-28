import { days, slots, type Lesson } from "@/lib/data";

export type Schedule = { name: string; grid: Lesson[][] };
export const emptyTimetable = (): Lesson[][] => days.map(() => slots.map(() => null));
export function parisTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return { day: ["Mon", "Tue", "Wed", "Thu", "Fri"].indexOf(part("weekday")), minutes: Number(part("hour")) * 60 + Number(part("minute")) };
}
export function currentLesson(grid: Lesson[][], date: Date) {
  const { day, minutes } = parisTime(date);
  const index = slots.findIndex((slot) => {
    const [hour = 0, minute = 0] = slot.split(":").map(Number);
    const start = hour * 60 + minute;
    return minutes >= start && minutes < start + 60;
  });
  if (day < 0 || index < 0) return null;
  const lesson = grid[day]?.[index];
  return lesson ? { ...lesson, slot: slots[index], end: `${String(Math.floor((minutes - (minutes % 60)) / 60)).padStart(2, "0")}` } : null;
}
export function slotEnd(slot: string) {
  const [hour = 0, minute = 0] = slot.split(":").map(Number);
  return `${String(hour + 1).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}