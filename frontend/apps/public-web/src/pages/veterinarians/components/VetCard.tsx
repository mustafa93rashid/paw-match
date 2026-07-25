import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Star, Stethoscope, User } from "lucide-react";
import { Badge, Card } from "@paw-match/ui";
import { getAverageRating } from "@paw-match/utilities";
import type { VetProfile } from "@paw-match/types";
import { paths } from "../../../routes/paths";

const consultationLabels: Record<string, string> = {
  vetConsultation: "Vet consultation",
  behaviorTraining: "Behavior training",
};

const dayAbbreviations: Record<string, string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

export interface VetCardProps {
  vet: VetProfile;
}

export const VetCard = ({ vet }: VetCardProps) => {
  const averageRating = getAverageRating(vet.reviews);

  const body = (
    <>
      <div className="flex items-start gap-4">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-600">
          {vet.userId?.profileImage ? (
            <img
              src={vet.userId.profileImage.url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-7 w-7" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-slate-900 group-hover:text-brand-700">
            {vet.userId ? `Dr. ${vet.userId.firstName} ${vet.userId.lastName}` : "Veterinarian"}
          </h3>
          <p className="text-sm text-slate-600">{vet.specialization ?? "General practice"}</p>
          {typeof averageRating === "number" && (
            <div className="mt-1 flex items-center gap-1 text-sm text-amber-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
              {averageRating.toFixed(1)}
              <span className="text-slate-500">({vet.reviews.length})</span>
            </div>
          )}
        </div>
      </div>

      {!vet.userId && (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          This profile's account details are currently unavailable.
        </p>
      )}

      <p className="text-sm text-slate-600">
        {vet.shelterId ? `${vet.shelterId.name}, ${vet.shelterId.city}` : "Independent veterinarian"}
      </p>

      <p className="flex items-center gap-2 text-sm text-slate-600">
        <Stethoscope className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        {vet.experienceYears} {vet.experienceYears === 1 ? "year" : "years"} of experience
      </p>

      <div className="mt-auto flex flex-wrap gap-2 pt-2">
        {vet.consultationTypes.map((type) => (
          <Badge key={type} tone="accent">
            {consultationLabels[type] ?? type}
          </Badge>
        ))}
      </div>

      {vet.availableDays.length > 0 && (
        <p className="text-xs text-slate-500">
          Available: {vet.availableDays.map((day) => dayAbbreviations[day] ?? day).join(", ")}
        </p>
      )}
    </>
  );

  return (
    <motion.div layout>
      <Card className="flex h-full flex-col gap-4">
        {vet.userId ? (
          <Link
            to={paths.veterinarianDetail(vet.userId._id)}
            className="group flex h-full flex-col gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {body}
          </Link>
        ) : (
          <div className="flex h-full flex-col gap-4">{body}</div>
        )}
      </Card>
    </motion.div>
  );
};
