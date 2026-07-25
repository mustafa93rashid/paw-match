import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PawPrint, Sparkles } from "lucide-react";
import { Badge, Card } from "@paw-match/ui";
import type { MatchDimension, MatchLevel, MatchedAnimal } from "@paw-match/types";
import { paths } from "../../../routes/paths";

const dimensionLabels: Record<MatchDimension, string> = {
  species: "Species",
  homeType: "Home environment",
  kids: "Good with kids",
  otherPets: "Good with other pets",
  experienceLevel: "Experience level",
  activityLevel: "Activity level",
  ownerType: "Household type",
  allergy: "Allergy friendliness",
};

const matchLevelTone: Record<MatchLevel, "accent" | "brand" | "neutral"> = {
  excellent: "accent",
  good: "brand",
  medium: "neutral",
  low: "neutral",
};

const matchLevelLabel: Record<MatchLevel, string> = {
  excellent: "Excellent match",
  good: "Good match",
  medium: "Medium match",
  low: "Low match",
};

export interface MatchedAnimalCardProps {
  animal: MatchedAnimal;
}

export const MatchedAnimalCard = ({ animal }: MatchedAnimalCardProps) => {
  const primaryImage = animal.images.find((image) => image.isPrimary) ?? animal.images[0];

  return (
    <motion.div layout>
      <Card padding="none" className="h-full overflow-hidden">
        <Link
          to={paths.animalDetail(animal._id)}
          className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <div className="relative h-44 w-full overflow-hidden bg-slate-100">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <PawPrint className="h-10 w-10" aria-hidden />
              </div>
            )}
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-900 shadow">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden />
              {animal.matchPercentage}% match
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-2 p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">
                {animal.name}
              </h3>
              <Badge tone={matchLevelTone[animal.matchLevel]}>
                {matchLevelLabel[animal.matchLevel]}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">
              {animal.breed} · {animal.age} {animal.ageUnit}
            </p>
            <p className="text-sm text-slate-600">
              {animal.shelterId.name}, {animal.shelterId.city}
            </p>

            {animal.matchedFields.length > 0 && (
              <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                {animal.matchedFields.slice(0, 4).map((field) => (
                  <span
                    key={field}
                    className="rounded-full bg-accent-50 px-2 py-0.5 text-xs text-accent-700"
                  >
                    {dimensionLabels[field]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
      </Card>
    </motion.div>
  );
};
