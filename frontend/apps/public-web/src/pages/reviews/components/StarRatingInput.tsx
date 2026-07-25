import { Star } from "lucide-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { ReviewFormValues } from "@paw-match/validation";

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

export interface StarRatingInputProps {
  control: Control<ReviewFormValues>;
  error?: string;
  disabled?: boolean;
}

/**
 * A native radiogroup styled as stars — not a clickable-icons-only widget.
 * Each star is a real <input type="radio"> (visually hidden, not display:none,
 * so it stays focusable), giving full keyboard (arrow keys, per native radio
 * group behavior) and screen-reader support without any custom ARIA
 * reimplementation.
 *
 * Driven via Controller rather than register(): RHF's register-based
 * getFieldValue() reads radio inputs straight off the DOM `value` attribute
 * (always a string) and never applies valueAsNumber/setValueAs for
 * isRadioInput fields. Controller's field.onChange sets form state to
 * whatever value it's given, so passing the already-numeric `value` keeps
 * `rating` a number end to end.
 */
export const StarRatingInput = ({ control, error, disabled }: StarRatingInputProps) => {
  const errorId = "rating-error";

  return (
    <div>
      <span id="rating-label" className="text-sm font-medium text-slate-700">
        Your rating
      </span>
      <Controller
        control={control}
        name="rating"
        render={({ field: { onChange, onBlur, value, name, ref } }) => (
          <div
            role="radiogroup"
            aria-labelledby="rating-label"
            aria-describedby={error ? errorId : undefined}
            className="mt-2 flex items-center gap-1"
          >
            {RATING_VALUES.map((ratingValue, index) => (
              <label
                key={ratingValue}
                className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 has-[:focus-visible]:ring-offset-1 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
              >
                <input
                  ref={index === 0 ? ref : undefined}
                  type="radio"
                  name={name}
                  checked={value === ratingValue}
                  onChange={() => onChange(ratingValue)}
                  onBlur={onBlur}
                  disabled={disabled}
                  className="peer sr-only"
                />
                <Star
                  className="h-8 w-8 text-slate-300 transition-colors peer-checked:fill-amber-400 peer-checked:text-amber-400"
                  aria-hidden
                />
                <span className="sr-only">
                  {ratingValue} {ratingValue === 1 ? "star" : "stars"}
                </span>
              </label>
            ))}
          </div>
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
