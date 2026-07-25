import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface ApplicationsFiltersValue {
  search: string;
  applicationType: string;
  status: string;
}

export interface ApplicationsFiltersProps {
  value: ApplicationsFiltersValue;
  onChange: (value: ApplicationsFiltersValue) => void;
}

const applicationTypeOptions = [
  { label: "Shelter Manager", value: "shelterManager" },
  { label: "Veterinarian", value: "vet" },
];

const statusOptions = [
  { label: "Pending verification", value: "pendingVerification" },
  { label: "Pending review", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

/** search/applicationType/status all map to real GET /staff-applications query params — see staffApplicationHooks. */
export const ApplicationsFilters = ({ value, onChange }: ApplicationsFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-3">
    <Input
      label="Search applications"
      hideLabel
      placeholder="Search by name or email"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })}
    />
    <Select
      label="Application type"
      hideLabel
      placeholder="All application types"
      options={applicationTypeOptions}
      value={value.applicationType}
      onChange={(event) => onChange({ ...value, applicationType: event.target.value })}
    />
    <Select
      label="Status"
      hideLabel
      placeholder="All statuses"
      options={statusOptions}
      value={value.status}
      onChange={(event) => onChange({ ...value, status: event.target.value })}
    />
  </div>
);
