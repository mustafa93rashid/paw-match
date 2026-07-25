import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface AdoptersFiltersValue {
  search: string;
  homeType: string;
  experienceLevel: string;
  ownerType: string;
  completion: string;
}

export interface AdoptersFiltersProps {
  value: AdoptersFiltersValue;
  onChange: (value: AdoptersFiltersValue) => void;
}

const homeTypeOptions = [
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Farm", value: "farm" },
];

const experienceOptions = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert", value: "expert" },
];

const ownerTypeOptions = [
  { label: "Single", value: "single" },
  { label: "Family", value: "family" },
];

const completionOptions = [
  { label: "Complete", value: "complete" },
  { label: "Incomplete", value: "incomplete" },
];

/** Every filter here is applied client-side against a single unfiltered fetch — GET /adopter-profile has no query params at all. */
export const AdoptersFilters = ({ value, onChange }: AdoptersFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
    <div className="sm:col-span-2">
      <Input
        label="Search adopters"
        hideLabel
        placeholder="Search by name or email"
        leadingIcon={<Search className="h-4 w-4" aria-hidden />}
        value={value.search}
        onChange={(event) => onChange({ ...value, search: event.target.value })}
      />
    </div>
    <Select
      label="Home type"
      hideLabel
      placeholder="All home types"
      options={homeTypeOptions}
      value={value.homeType}
      onChange={(event) => onChange({ ...value, homeType: event.target.value })}
    />
    <Select
      label="Experience level"
      hideLabel
      placeholder="All experience levels"
      options={experienceOptions}
      value={value.experienceLevel}
      onChange={(event) => onChange({ ...value, experienceLevel: event.target.value })}
    />
    <Select
      label="Household type"
      hideLabel
      placeholder="All household types"
      options={ownerTypeOptions}
      value={value.ownerType}
      onChange={(event) => onChange({ ...value, ownerType: event.target.value })}
    />
    <Select
      label="Profile completion"
      hideLabel
      placeholder="Any completion status"
      options={completionOptions}
      value={value.completion}
      onChange={(event) => onChange({ ...value, completion: event.target.value })}
    />
  </div>
);
