import { describe, expect, it } from "vitest";
import { optiInputSchema, optiReplySchema } from "@/lib/opti-assistant";
import { optiImage, optiCatalog } from "@/lib/opti-assets";

describe("Opti", () => {
  it("uses the provided mood and flight animations with still-image alternatives", () => {
    expect(optiImage("error").name).toBe("Animation de la chouette triste « Erreur »");
    expect(optiImage("flying").name).toBe("Hibou robot bleu en vol animé");
    expect(optiImage("thinking", true).animated).toBe(false);
    expect(optiCatalog.length).toBe(56);
  });
  it("restricts assistant navigation to the existing school pages", () => {
    expect(optiReplySchema.parse({ reply: "Ouvrez les paramètres.", mood: "explaining", destination: "/parametres" }).destination).toBe("/parametres");
    expect(optiReplySchema.safeParse({ reply: "Ouvrez ce site", mood: "explaining", destination: "https://external.example" }).success).toBe(false);
  });
  it("rejects unrecognized moods and oversized input", () => {
    expect(optiReplySchema.safeParse({ reply: "Bonjour", mood: "unknown", destination: "" }).success).toBe(false);
    expect(optiInputSchema.safeParse({ school: "", messages: [{ role: "user", content: "x".repeat(6001) }] }).success).toBe(false);
  });
});