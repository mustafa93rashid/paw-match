import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";
import { cn } from "@paw-match/utilities";

export interface AnimalsFiltersValue {
  search: string;
  species: string;
  adoptionStatus: string;
  healthStatus: string;
  sort: string;
}

export interface AnimalsFiltersProps {
  value: AnimalsFiltersValue;
  onChange: (value: AnimalsFiltersValue) => void;
  /** Super Admin's shelter drill-down view owns adoption-status via its own status tabs instead — avoids showing the same filter twice. */
  hideAdoptionStatus?: boolean;
}

const speciesOptions = [
  { label: "Dogs", value: "dog" },
  { label: "Cats", value: "cat" },
  { label: "Birds", value: "bird" },
  { label: "Rabbits", value: "rabbit" },
  { label: "Fish", value: "fish" },
  { label: "Other", value: "other" },
];

const adoptionStatusOptions = [
  { label: "Available", value: "available" },
  { label: "Pending", value: "pending" },
  { label: "Adopted", value: "adopted" },
  { label: "Unavailable", value: "unavailable" },
];

const healthStatusOptions = [
  { label: "Healthy", value: "healthy" },
  { label: "Needs care", value: "needsCare" },
  { label: "Special needs", value: "specialNeeds" },
  { label: "Under treatment", value: "underTreatment" },
];

const sortOptions = [
  { label: "Newest first", value: "newest" },
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Age (youngest first)", value: "age-asc" },
  { label: "Age (oldest first)", value: "age-desc" },
];

/** search/species/adoptionStatus/healthStatus map to real GET /animals query params; sort is entirely client-side (no server-side sort exists). Gender/size/vaccinated filters exist on the backend too but are deliberately left out of this filter bar to keep it usable — narrower than the full backend capability, not a gap. */
export const AnimalsFilters = ({ value, onChange, hideAdoptionStatus }: AnimalsFiltersProps) => (
  <div
    className={cn(
      "grid gap-4 sm:grid-cols-2",
      hideAdoptionStatus ? "lg:grid-cols-4" : "lg:grid-cols-5",
    )}
  >
    <Input
      label="Search animals"
      hideLabel
      placeholder="Search by name, breed, or description"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })}
    />
    <Select
      label="Species"
      hideLabel
      placeholder="All species"
      options={speciesOptions}
      value={value.species}
      onChange={(event) => onChange({ ...value, species: event.target.value })}
    />
    {!hideAdoptionStatus && (
      <Select
        label="Adoption status"
        hideLabel
        placeholder="All adoption statuses"
        options={adoptionStatusOptions}
        value={value.adoptionStatus}
        onChange={(event) => onChange({ ...value, adoptionStatus: event.target.value })}
      />
    )}
    <Select
      label="Health status"
      hideLabel
      placeholder="All health statuses"
      options={healthStatusOptions}
      value={value.healthStatus}
      onChange={(event) => onChange({ ...value, healthStatus: event.target.value })}
    />
    <Select
      label="Sort"
      hideLabel
      options={sortOptions}
      value={value.sort}
      onChange={(event) => onChange({ ...value, sort: event.target.value })}
    />
  </div>
);
