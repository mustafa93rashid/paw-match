import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Eye, Heart, MapPin } from "lucide-react";
import { Badge } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { Animal, AdoptionStatus } from "@paw-match/types";
import { paths } from "../../../routes/paths";

const statusTone: Record<AdoptionStatus, BadgeTone> = {
  available: "accent",
  pending: "brand",
  adopted: "neutral",
  unavailable: "danger",
};

const statusLabel: Record<AdoptionStatus, string> = {
  available: "Available",
  pending: "Pending",
  adopted: "Adopted",
  unavailable: "Unavailable",
};

export interface AnimalSlideCardProps {
  animal: Animal;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onQuickView: (animal: Animal) => void;
}

export const AnimalSlideCard = ({
  animal,
  isFavorite,
  onToggleFavorite,
  onQuickView,
}: AnimalSlideCardProps) => {
  const primaryImage = animal.images.find((image) => image.isPrimary) ?? animal.images[0];

  return (
    <motion.div
      className="group relative w-[280px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-white shadow-xl shadow-slate-900/5 sm:w-[320px]"
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <div className="relative h-72 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={animal.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-slate-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-transparent" />

        <Badge tone={statusTone[animal.adoptionStatus]} className="absolute left-4 top-4">
          {statusLabel[animal.adoptionStatus]}
        </Badge>

        <button
          type="button"
          onClick={() => onToggleFavorite(animal._id)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-md transition-colors hover:bg-white"
        >
          <Heart
            className="h-4 w-4"
            fill={isFavorite ? "currentColor" : "none"}
            style={{ color: isFavorite ? "#e0430f" : undefined }}
            aria-hidden
          />
        </button>

        <button
          type="button"
          onClick={() => onQuickView(animal)}
          className="absolute inset-x-4 bottom-4 flex translate-y-3 items-center justify-center gap-2 rounded-xl bg-white/95 py-2.5 text-sm font-semibold text-slate-900 opacity-0 shadow-lg transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Eye className="h-4 w-4" aria-hidden />
          Quick view
        </button>
      </div>

      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{animal.name}</h3>
            <p className="text-sm text-slate-500">{animal.breed}</p>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {animal.shelterId.name}
        </p>

        <Link
          to={paths.animalDetail(animal._id)}
          className="mt-1 inline-flex w-full items-center justify-center rounded-full border border-slate-200 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
        >
          View profile
        </Link>
      </div>
    </motion.div>
  );
};
