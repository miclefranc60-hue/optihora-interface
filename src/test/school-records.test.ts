import { describe, expect, it } from "vitest";
import { classSchema, teacherSchema, roomSchema, ensureUniqueName } from "@/lib/school-records";

describe("School additions", () => {
  it("creates a class with its entered details", () => {
    expect(classSchema.parse({ name: " 6eB ", level: "Collège", students: "28", hours: "26", mainTeacher: "Mme Martin" })).toEqual({ name: "6eB", level: "Collège", students: 28, hours: 26, mainTeacher: "Mme Martin" });
  });
  it("creates a teacher with assigned classes", () => {
    expect(teacherSchema.parse({ name: "Mme Martin", subject: "fr", hours: "18", classes: ["6eB"] })).toEqual({ name: "Mme Martin", subject: "fr", hours: 18, classes: ["6eB"] });
  });
  it("creates an unoccupied room with the entered capacity", () => {
    expect(roomSchema.parse({ name: "A103", type: "Salle de cours", capacity: "32" })).toEqual({ name: "A103", type: "Salle de cours", capacity: 32, occupancy: 0 });
  });
  it("rejects duplicate names without changing the list", () => {
    const records = [{ name: "6eA" }];
    expect(() => ensureUniqueName(records, " 6EA ")).toThrow();
    expect(records).toEqual([{ name: "6eA" }]);
  });
});