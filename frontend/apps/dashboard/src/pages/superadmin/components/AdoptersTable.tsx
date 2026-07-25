import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  UserAvatar,
  VisuallyHidden,
} from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { AdopterProfile } from "@paw-match/types";
import { isMatchingProfileComplete } from "@paw-match/utilities";
import { paths } from "../../../routes/paths";

const homeTypeLabel: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  farm: "Farm",
};

const experienceLabel: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};

const ownerTypeLabel: Record<string, string> = {
  single: "Single",
  family: "Family",
};

const completionTone: Record<"complete" | "incomplete", BadgeTone> = {
  complete: "accent",
  incomplete: "danger",
};

export interface AdoptersTableProps {
  profiles: AdopterProfile[];
}

/**
 * Read-only list — every row links to a dedicated detail page
 * (GET /adopter-profile/:userId) rather than a modal, since Shelter
 * Employee reaches the same page from a different entry point (an
 * adoption request) without ever seeing this list.
 *
 * userId can be null: populate() resolves it to null when the referenced
 * User account no longer exists (confirmed against real data — most
 * AdopterProfile documents in this database are currently orphaned this
 * way). Those rows render as "Unknown adopter" with no view action, since
 * GET /adopter-profile/:userId has no other identifier to look them up by.
 */
export const AdoptersTable = ({ profiles }: AdoptersTableProps) => (
  <Table>
    <TableHead>
      <TableHeaderCell>Adopter</TableHeaderCell>
      <TableHeaderCell>Home type</TableHeaderCell>
      <TableHeaderCell>Experience</TableHeaderCell>
      <TableHeaderCell>Household</TableHeaderCell>
      <TableHeaderCell>Profile</TableHeaderCell>
      <TableHeaderCell>
        <VisuallyHidden>Actions</VisuallyHidden>
      </TableHeaderCell>
    </TableHead>
    <TableBody>
      {profiles.map((profile) => {
        const complete = isMatchingProfileComplete(profile);
        const user = profile.userId;

        return (
          <TableRow key={profile._id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <UserAvatar firstName={user?.firstName} lastName={user?.lastName} profileImage={user?.profileImage} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {user ? `${user.firstName} ${user.lastName}` : "Unknown adopter"}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user?.email ?? "Account deleted"}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-slate-600">
              {profile.homeType ? homeTypeLabel[profile.homeType] : <span className="text-slate-400">—</span>}
            </TableCell>
            <TableCell className="text-slate-600">
              {profile.experienceLevel ? (
                experienceLabel[profile.experienceLevel]
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </TableCell>
            <TableCell className="text-slate-600">
              {profile.ownerType ? ownerTypeLabel[profile.ownerType] : <span className="text-slate-400">—</span>}
            </TableCell>
            <TableCell>
              <Badge tone={completionTone[complete ? "complete" : "incomplete"]}>
                {complete ? "Complete" : "Incomplete"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end">
                {user && (
                  <Link
                    to={paths.adopterDetail(user._id)}
                    aria-label={`View ${user.firstName} ${user.lastName}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                  </Link>
                )}
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);
