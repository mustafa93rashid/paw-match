import { Select } from "@paw-match/ui";

export type ReviewsFilterValue = "all" | "needsReply" | "replied";

export interface ReviewsFiltersProps {
  value: ReviewsFilterValue;
  onChange: (value: ReviewsFilterValue) => void;
}

const filterOptions: { label: string; value: ReviewsFilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Needs reply", value: "needsReply" },
  { label: "Replied", value: "replied" },
];

/** Entirely client-side — neither review-listing mechanism (embedded in GET /shelters/:id or GET /vet-profile/me) supports server-side filtering. */
export const ReviewsFilters = ({ value, onChange }: ReviewsFiltersProps) => (
  <div className="max-w-xs">
    <Select
      label="Filter reviews"
      hideLabel
      options={filterOptions}
      value={value}
      onChange={(event) => onChange(event.target.value as ReviewsFilterValue)}
    />
  </div>
);
