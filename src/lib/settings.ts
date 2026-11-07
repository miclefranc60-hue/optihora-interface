import { z } from "zod";
import { subjects } from "@/lib/data";

export const minutesOf = (time: string) => { const [h = 0, m = 0] = time.split(":").map(Number); return h * 60 + m; };
export const timeAt = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
export const settingsSchema = z.object({ duration: z.coerce.number().int().min(15).max(90), includedSubjects: z.array(z.string().min(1)).min(1), allowSimultaneousLessons: z.boolean().default(false), coursesPerDay: z.coerce.number().int().min(1).max(8).default(8) });
export const unavailabilitySchema = z.object({ id: z.string(), teacher: z.string().min(1), day: z.coerce.number().int().min(0).max(4), start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), reason: z.string().trim().max(200) }).refine((value) => minutesOf(value.end) > minutesOf(value.start), { message: "L’heure de fin doit être après l’heure de début." });
export type SchoolSettings = z.infer<typeof settingsSchema>;
export type Unavailability = z.infer<typeof unavailabilitySchema>;
export const defaultSettings: SchoolSettings = { duration: 60, includedSubjects: subjects.map((subject) => subject.id), allowSimultaneousLessons: false, coursesPerDay: 8 };
export function courseSlots(duration: number, coursesPerDay = 8) {
  const afternoon = Math.max(810, 480 + 4 * duration + 60);
  return Array.from({ length: Math.min(8, Math.max(1, coursesPerDay)) }, (_, index) => timeAt(index < 4 ? 480 + index * duration : afternoon + (index - 4) * duration));
}
export function teacherUnavailable(constraints: Unavailability[], teacher: string, day: number, start: string, duration: number) {
  const from = minutesOf(start);
  return constraints.some((item) => item.teacher === teacher && item.day === day && from < minutesOf(item.end) && from + duration > minutesOf(item.start));
}