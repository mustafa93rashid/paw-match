import { Search } from "lucide-react";
import { Input, Select } from "@paw-match/ui";

export interface UsersFiltersValue {
  search: string;
  role: string;
  isActive: string;
}

export interface UsersFiltersProps {
  value: UsersFiltersValue;
  onChange: (value: UsersFiltersValue) => void;
}

const roleOptions = [
  { label: "Super Admin", value: "superadmin" },
  { label: "Shelter Employee", value: "shelterEmployee" },
  { label: "Veterinarian", value: "vet" },
  { label: "Adopter", value: "adopter" },
];

const activeStatusOptions = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

/** Every filter here is applied client-side against a single unfiltered fetch — GET /user has no query params at all. */
export const UsersFilters = ({ value, onChange }: UsersFiltersProps) => (
  <div className="grid gap-4 sm:grid-cols-3">
    <Input
      label="Search users"
      hideLabel
      placeholder="Search by name or email"
      leadingIcon={<Search className="h-4 w-4" aria-hidden />}
      value={value.search}
      onChange={(event) => onChange({ ...value, search: event.target.value })}
    />
    <Select
      label="Role"
      hideLabel
      placeholder="All roles"
      options={roleOptions}
      value={value.role}
      onChange={(event) => onChange({ ...value, role: event.target.value })}
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
