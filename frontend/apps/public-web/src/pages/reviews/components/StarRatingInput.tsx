import { Star } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";
import type { ReviewFormValues } from "@paw-match/validation";

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

export interface StarRatingInputProps {
  register: UseFormRegister<ReviewFormValues>;
  error?: string;
  disabled?: boolean;
}

/**
 * A native radiogroup styled as stars — not a clickable-icons-only widget.
 * Each star is a real <input type="radio"> (visually hidden, not display:none,
 * so it stays focusable), giving full keyboard (arrow keys, per native radio
 * group behavior) and screen-reader support without any custom ARIA
 * reimplementation.
 */
export const StarRatingInput = ({ register, error, disabled }: StarRatingInputProps) => {
  const errorId = "rating-error";

  return (
    <div>
      <span id="rating-label" className="text-sm font-medium text-slate-700">
        Your rating
      </span>
      <div
        role="radiogroup"
        aria-labelledby="rating-label"
        aria-describedby={error ? errorId : undefined}
        className="mt-2 flex items-center gap-1"
      >
        {RATING_VALUES.map((value) => (
          <label
            key={value}
            className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 has-[:focus-visible]:ring-offset-1 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
          >
            <input
              type="radio"
              value={value}
              disabled={disabled}
              className="peer sr-only"
              {...register("rating", { valueAsNumber: true })}
            />
            <Star
              className="h-8 w-8 text-slate-300 transition-colors peer-checked:fill-amber-400 peer-checked:text-amber-400"
              aria-hidden
            />
            <span className="sr-only">
              {value} {value === 1 ? "star" : "stars"}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
