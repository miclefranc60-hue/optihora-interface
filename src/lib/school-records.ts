import { z } from "zod";
import type { Unavailability } from "@/lib/settings";
import type { Schedule } from "@/lib/timetable";

const name = z.string().trim().min(1, "Le nom est obligatoire.").max(100);
const integer = z.coerce.number().int().nonnegative();
export const classSchema = z.object({ name, level: z.enum(["École", "Collège", "Lycée"]), students: integer, mainTeacher: z.string().trim(), hours: integer });
export const teacherSchema = z.object({ name, subject: z.string().min(1), hours: integer, classes: z.array(z.string()) });
export const roomSchema = z.object({ name, type: z.enum(["Salle de cours", "Laboratoire", "Salle informatique", "Sport", "Bibliothèque"]), capacity: z.coerce.number().int().positive(), occupancy: z.number().min(0).max(100).default(0) });
export type SchoolClass = z.infer<typeof classSchema>;
export type Teacher = z.infer<typeof teacherSchema>;
export type Room = z.infer<typeof roomSchema>;
export function ensureUniqueName(records: { name: string }[], value: string) {
  if (records.some((record) => record.name.toLocaleLowerCase("fr") === value.trim().toLocaleLowerCase("fr"))) {
    throw new Error("Ce nom existe déjà. Choisissez un autre nom.");
  }
}
export function editTeacherRecords(state: { teachers: Teacher[]; classes: SchoolClass[]; constraints: Unavailability[]; schedules: Record<string, Schedule> }, originalName: string, value: Teacher) {
  const record = teacherSchema.parse(value);
  if (!state.teachers.some((teacher) => teacher.name === originalName)) throw new Error("Enseignant inconnu.");
  ensureUniqueName(state.teachers.filter((teacher) => teacher.name !== originalName), record.name);
  return {
    teachers: state.teachers.map((teacher) => teacher.name === originalName ? record : teacher),
    classes: state.classes.map((item) => item.mainTeacher === originalName ? { ...item, mainTeacher: record.name } : item),
    constraints: state.constraints.map((item) => item.teacher === originalName ? { ...item, teacher: record.name } : item),
    schedules: Object.fromEntries(Object.entries(state.schedules).map(([name, schedule]) => [name, { ...schedule, grid: schedule.grid.map((row) => row.map((lesson) => lesson?.teacher === originalName ? { ...lesson, teacher: record.name } : lesson)) }])),
  };
}