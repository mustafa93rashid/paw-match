import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface SheltersFiltersValue {
  search: string;
  verificationStatus: string;
  isActive: string;
}

export interface SheltersFiltersProps {
  value: SheltersFiltersValue;
  onChange: (value: SheltersFiltersValue) => void;
}

const verificationStatusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const activeStatusOptions = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

/** Every filter here is applied client-side against a single unfiltered fetch — see SheltersPage. */
export const SheltersFilters = ({ value, onChange }: SheltersFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-3">
    <Input
      label="Search shelters"
      hideLabel
      placeholder="Search by name, email, or city"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })}
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
      label="Active status"
      hideLabel
      placeholder="All active statuses"
      options={activeStatusOptions}
      value={value.isActive}
      onChange={(event) => onChange({ ...value, isActive: event.target.value })}
    />
  </div>
);
