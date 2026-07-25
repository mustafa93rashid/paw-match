import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PawPrint } from "lucide-react";
import { Badge, Card } from "@paw-match/ui";
import type { Animal } from "@paw-match/types";
import { paths } from "../../../routes/paths";

const adoptionStatusTone: Record<Animal["adoptionStatus"], "brand" | "accent" | "neutral"> = {
  available: "accent",
  pending: "brand",
  adopted: "neutral",
  unavailable: "neutral",
};

const adoptionStatusLabel: Record<Animal["adoptionStatus"], string> = {
  available: "Available",
  pending: "Pending adoption",
  adopted: "Adopted",
  unavailable: "Unavailable",
};

export interface AnimalCardProps {
  animal: Animal;
}

export const AnimalCard = ({ animal }: AnimalCardProps) => {
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
            <span className="absolute right-3 top-3">
              <Badge tone={adoptionStatusTone[animal.adoptionStatus]}>
                {adoptionStatusLabel[animal.adoptionStatus]}
              </Badge>
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-2 p-5">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">
              {animal.name}
            </h3>
            <p className="text-sm text-slate-600">
              {animal.breed} · {animal.age} {animal.ageUnit}
            </p>
            <p className="text-sm text-slate-600">
              {animal.shelterId.name}, {animal.shelterId.city}
            </p>

            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <Badge tone="neutral" className="capitalize">
                {animal.species}
              </Badge>
              <Badge tone="neutral" className="capitalize">
                {animal.size}
              </Badge>
              {animal.vaccinated && <Badge tone="neutral">Vaccinated</Badge>}
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
};
