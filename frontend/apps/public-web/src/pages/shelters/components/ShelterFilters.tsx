import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";
import type { Species } from "@paw-match/types";

const speciesOptions: { label: string; value: Species }[] = [
  { label: "Dogs", value: "dog" },
  { label: "Cats", value: "cat" },
  { label: "Birds", value: "bird" },
  { label: "Rabbits", value: "rabbit" },
  { label: "Fish", value: "fish" },
  { label: "Other", value: "other" },
];

export interface ShelterFiltersValue {
  search: string;
  city: string;
  species: string;
}

export interface ShelterFiltersProps {
  value: ShelterFiltersValue;
  onChange: (value: ShelterFiltersValue) => void;
}

export const ShelterFilters = ({ value, onChange }: ShelterFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-3">
    <Input
      label="Search shelters"
      hideLabel
      placeholder="Search by name or description"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })}
    />
    <Input
      label="City"
      hideLabel
      placeholder="Filter by city"
      value={value.city}
      onChange={(event) => onChange({ ...value, city: event.target.value })}
    />
    <Select
      label="Species"
      hideLabel
      placeholder="All species"
      options={speciesOptions}
      value={value.species}
      onChange={(event) => onChange({ ...value, species: event.target.value })}
    />
  </div>
);
