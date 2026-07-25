import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, MapPin, PawPrint } from "lucide-react";
import { Badge, Card } from "@paw-match/ui";
import type { ImageRef, OperatingHours, Species } from "@paw-match/types";

export interface ShelterCardData {
  _id: string;
  name: string;
  city: string;
  address: string;
  logo: ImageRef | null;
  supportedSpecies: Species[];
  operatingHours: OperatingHours;
  distanceInKm?: number;
}

export interface ShelterCardProps {
  shelter: ShelterCardData;
  to: string;
}

export const ShelterCard = ({ shelter, to }: ShelterCardProps) => (
  <motion.div layout>
    <Card padding="none" className="h-full overflow-hidden">
      <Link
        to={to}
        className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <div className="relative h-40 w-full overflow-hidden bg-slate-100">
          {shelter.logo ? (
            <img
              src={shelter.logo.url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <PawPrint className="h-10 w-10" aria-hidden />
            </div>
          )}
          {typeof shelter.distanceInKm === "number" && (
            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow">
              {shelter.distanceInKm} km away
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">
            {shelter.name}
          </h3>

          <p className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span>
              {shelter.address}, {shelter.city}
            </span>
          </p>

          {shelter.operatingHours.open && shelter.operatingHours.close && (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              {shelter.operatingHours.open} – {shelter.operatingHours.close}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {shelter.supportedSpecies.slice(0, 4).map((species) => (
              <Badge key={species} tone="neutral" className="capitalize">
                {species}
              </Badge>
            ))}
          </div>
        </div>
      </Link>
    </Card>
  </motion.div>
);
