import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { optiInputSchema, optiReplySchema, optiInstructions } from "@/lib/opti-assistant";

export const askOpti = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => optiInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const response = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: optiInstructions,
        input: JSON.stringify({ contexte_etablissement: data.school, conversation: data.messages }),
        text: { format: { type: "json_schema", name: "opti_reply", strict: true, schema: {
          type: "object", additionalProperties: false,
          properties: { reply: { type: "string" }, mood: { type: "string", enum: ["explaining", "question", "success", "error", "building", "thinking"] }, destination: { type: "string", enum: ["", "/", "/classes", "/enseignants", "/salles", "/parametres", "/emploi-du-temps"] } },
          required: ["reply", "mood", "destination"],
        } } },
      });
      const text = response.output.flatMap((item) => item.type === "message" ? item.content.flatMap((content) => content.type === "output_text" ? [content.text] : []) : []).join("");
      if (!text) return { ok: false as const, message: "Opti n’a pas pu répondre à cette demande. Vous pouvez la reformuler." };
      return { ok: true as const, ...optiReplySchema.parse(JSON.parse(text)) };
    } catch (error) {
      if (error instanceof GatewayError) {
        if (error.httpStatus === 402) return { ok: false as const, message: "Les crédits de l’assistant sont épuisés. L’établissement doit recharger ses crédits pour continuer." };
        if (error.httpStatus === 429) return { ok: false as const, message: "Opti reçoit beaucoup de demandes. Patientez avant de réessayer." };
      }
      return { ok: false as const, message: "Opti est momentanément indisponible. Votre message est conservé; vous pourrez réessayer." };
    }
  });