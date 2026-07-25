import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface ShelterOverviewFiltersValue {
  search: string;
  city: string;
  isActive: string;
  verificationStatus: string;
  sort: string;
}

export interface ShelterOverviewFiltersProps {
  value: ShelterOverviewFiltersValue;
  onChange: (value: ShelterOverviewFiltersValue) => void;
  cityOptions: { label: string; value: string }[];
}

const activeStatusOptions = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const verificationStatusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const sortOptions = [
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Newest first", value: "newest" },
  { label: "Most animals", value: "animal-count" },
];

/** Every filter here runs client-side against the single unfiltered admin-shelters fetch — same convention as SheltersFilters/SheltersPage. */
export const ShelterOverviewFilters = ({ value, onChange, cityOptions }: ShelterOverviewFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <Input
      label="Search shelters"
      hideLabel
      placeholder="Search by shelter name"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })}
    />
    <Select
      label="City"
      hideLabel
      placeholder="All cities"
      options={cityOptions}
      value={value.city}
      onChange={(event) => onChange({ ...value, city: event.target.value })}
    />
    <Select
      label="Active status"
      hideLabel
      placeholder="All active statuses"
      options={activeStatusOptions}
      value={value.isActive}
      onChange={(event) => onChange({ ...value, isActive: event.target.value })}
    />
    <Select
      label="Verification status"
      hideLabel
      placeholder="All verification statuses"
      options={verificationStatusOptions}
      value={value.verificationStatus}
      onChange={(event) => onChange({ ...value, verificationStatus: event.target.value })}
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
