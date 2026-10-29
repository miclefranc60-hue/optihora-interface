import { z } from "zod";

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