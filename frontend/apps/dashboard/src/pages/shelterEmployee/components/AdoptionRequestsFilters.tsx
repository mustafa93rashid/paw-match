import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface AdoptionRequestsFiltersValue {
  search: string;
  status: string;
}

export interface AdoptionRequestsFiltersProps {
  value: AdoptionRequestsFiltersValue;
  onChange: (value: AdoptionRequestsFiltersValue) => void;
}

const statusOptions = [
  { label: "Pending review", value: "pendingReview" },
  { label: "Interview", value: "interview" },
  { label: "Home check", value: "homeCheck" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Completed", value: "completed" },
];

/** status maps to the real GET /adoptions/shelter query param; search (adopter name/email, animal name) is entirely client-side — the backend has no free-text search for this endpoint. */
export const AdoptionRequestsFilters = ({ value, onChange }: AdoptionRequestsFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <Input
      label="Search requests"
      hideLabel
      placeholder="Search by adopter or animal name"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })}
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
