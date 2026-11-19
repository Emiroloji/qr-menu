import { z } from "zod";
import { cleanText } from "@/lib/clean-text";
import { FEEDBACK_MESSAGE_MAX } from "@/lib/feedback-rules";
import { isLanguageCode } from "@/lib/languages";

/** Menüden gelen değerlendirme (oturumsuz; her alan sunucuda doğrulanır). */
export const feedbackSchema = z.object({
  branchId: z.string().min(1).max(40),
  rating: z.number().int().min(1).max(5),
  message: z
    .string()
    .max(FEEDBACK_MESSAGE_MAX * 2)
    .transform(cleanText)
    .pipe(z.string().max(FEEDBACK_MESSAGE_MAX))
    .transform((m) => m || null),
  lang: z.string().refine(isLanguageCode),
});
