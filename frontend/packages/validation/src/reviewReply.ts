/**
 * Zod schema for the shelterEmployee/vet reply-to-review form. Caps at 500
 * characters — not the backend's looser 1000-char express-validator limit.
 * The Review model's reply.text schema field caps at 500; a reply between
 * 501-1000 chars would pass validation then throw an uncaught Mongoose
 * ValidationError on save (surfaced as a raw 400, not a clean custom
 * error). Capping here at the model's real limit makes that inconsistency
 * unreachable from this form — same defensive pattern already used by the
 * existing adopter-facing reviewFormSchema's comment field.
 */
import { z } from "zod";

export const reviewReplySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "A reply is required")
    .max(500, "Reply cannot exceed 500 characters"),
});

export type ReviewReplyFormValues = z.infer<typeof reviewReplySchema>;
