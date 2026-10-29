import { describe, expect, it } from "vitest";
import { subjects } from "@/lib/data";
import { createSubject, findSubject } from "@/lib/subjects";
import { settingsSchema } from "@/lib/settings";
import { teacherSchema } from "@/lib/school-records";

describe("Custom subjects", () => {
  it("adds a custom subject alongside predefined subjects and supports settings and teachers", () => {
    const subject = createSubject(subjects, " Technologie ", "custom-tech");
    const catalog = [...subjects, subject];
    expect(findSubject(catalog, "custom-tech").name).toBe("Technologie");
    expect(findSubject(catalog, "math").name).toBe("Mathématiques");
    expect(settingsSchema.parse({ duration: 60, includedSubjects: ["math", subject.id] }).includedSubjects).toContain("custom-tech");
    expect(teacherSchema.parse({ name: "Mme Martin", subject: subject.id, hours: 18, classes: [] }).subject).toBe("custom-tech");
  });
  it("rejects a duplicate of a predefined or custom subject", () => {
    expect(() => createSubject(subjects, " mathématiques ", "duplicate")).toThrow();
    const custom = createSubject(subjects, "Technologie", "custom-tech");
    expect(() => createSubject([...subjects, custom], " TECHNOLOGIE ", "duplicate")).toThrow();
  });
  it("rejects blank subject names", () => {
    expect(() => createSubject(subjects, "   ", "blank")).toThrow();
  });
});