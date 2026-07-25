import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface AppointmentsFiltersValue {
  search: string;
  status: string;
}

export interface AppointmentsFiltersProps {
  value: AppointmentsFiltersValue;
  onChange: (value: AppointmentsFiltersValue) => void;
}

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

/** status maps to the real GET /vetappointments/vet query param; search (adopter name/email) is entirely client-side — the backend has no free-text search for this endpoint. */
export const AppointmentsFilters = ({ value, onChange }: AppointmentsFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <Input
      label="Search appointments"
      hideLabel
      placeholder="Search by adopter name or email"
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
