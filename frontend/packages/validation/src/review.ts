/**
 * Zod schema mirroring src/validation/review.validate.js's
 * createReviewValidation/updateReviewValidation — but capping `comment` at
 * 500 characters (the Review model's real schema limit), not the
 * validator's looser 1000, since a 501-1000 char submission would pass
 * express-validator and then fail Mongoose's own validation server-side.
 * `targetType` and `transactionId` come from the route, not the form.
 */
import { z } from "zod";

export const reviewFormSchema = z.object({
  rating: z
    .number()
    .refine((value) => Number.isInteger(value) && value >= 1 && value <= 5, {
      message: "Please select a rating between 1 and 5 stars",
    }),
  comment: z
    .string()
    .trim()
    .max(500, "Comment cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;
