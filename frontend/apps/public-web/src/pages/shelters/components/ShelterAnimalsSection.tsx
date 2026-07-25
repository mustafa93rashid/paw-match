import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { Badge, Card } from "@paw-match/ui";
import type { ShelterDetailAnimal } from "@paw-match/types";
import { paths } from "../../../routes/paths";

export interface ShelterAnimalsSectionProps {
  animals: ShelterDetailAnimal[];
}

export const ShelterAnimalsSection = ({ animals }: ShelterAnimalsSectionProps) => (
  <div className="mt-8 border-t border-slate-200 pt-6">
    <h2 className="text-lg font-semibold text-slate-900">Available animals</h2>

    {animals.length === 0 ? (
      <p className="mt-3 text-sm text-slate-600">
        This shelter has no available animals right now.
      </p>
    ) : (
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {animals.map((animal) => {
          const primaryImage =
            animal.images.find((image) => image.isPrimary) ?? animal.images[0];

          return (
            <Card key={animal._id} padding="none" className="overflow-hidden">
              <Link
                to={paths.animalDetail(animal._id)}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                  {primaryImage ? (
                    <img
                      src={primaryImage.url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <PawPrint className="h-8 w-8" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                    {animal.name}
                  </span>
                  <span className="text-xs text-slate-600">
                    {animal.breed} · {animal.age} {animal.ageUnit}
                  </span>
                  <Badge tone="neutral" className="mt-1 w-fit capitalize">
                    {animal.species}
                  </Badge>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>
    )}
  </div>
);
