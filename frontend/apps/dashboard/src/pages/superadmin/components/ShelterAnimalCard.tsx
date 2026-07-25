import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PawPrint } from "lucide-react";
import { Badge, Card } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { AdminShelter } from "@paw-match/types";
import { paths } from "../../../routes/paths";

const verificationTone: Record<AdminShelter["verificationStatus"], BadgeTone> = {
  pending: "neutral",
  approved: "brand",
  rejected: "danger",
};

const verificationLabel: Record<AdminShelter["verificationStatus"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export interface ShelterAnimalCardProps {
  shelter: AdminShelter;
  animalCount: number;
  availableCount: number;
  index?: number;
}

/**
 * Level 1 of Super Admin's shelter-first Animals flow — the whole card
 * navigates to that shelter's animals (paths.animalShelterDetail), plus an
 * explicit trailing button/link for the same action (keyboard- and
 * screen-reader-friendly: the card itself is a real <Link>, not a div with
 * an onClick, so it's reachable and activatable exactly like any other
 * link without extra handling).
 */
export const ShelterAnimalCard = ({ shelter, animalCount, availableCount, index = 0 }: ShelterAnimalCardProps) => {
  const reduceMotion = Boolean(useReducedMotion());
  const occupancy = shelter.capacity > 0 ? Math.round((animalCount / shelter.capacity) * 100) : null;

  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.04 }}
    >
      <Card padding="none" className="h-full overflow-hidden">
        <Link
          to={paths.animalShelterDetail(shelter._id)}
          className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <div className="flex items-start gap-3 p-5 pb-4">
            {shelter.logo ? (
              <img src={shelter.logo.url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-semibold text-brand-700">
                {shelter.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-slate-900">{shelter.name}</h3>
              <p className="truncate text-sm text-slate-500">{shelter.city}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 px-5">
            <Badge tone={verificationTone[shelter.verificationStatus]}>
              {verificationLabel[shelter.verificationStatus]}
            </Badge>
            <Badge tone={shelter.isActive ? "accent" : "neutral"}>{shelter.isActive ? "Active" : "Inactive"}</Badge>
          </div>

          {shelter.supportedSpecies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 px-5">
              {shelter.supportedSpecies.slice(0, 4).map((species) => (
                <Badge key={species} tone="neutral" className="capitalize">
                  {species}
                </Badge>
              ))}
              {shelter.supportedSpecies.length > 4 && (
                <Badge tone="neutral">+{shelter.supportedSpecies.length - 4}</Badge>
              )}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 px-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Animals</p>
              <p className="mt-0.5 font-semibold text-slate-900">{animalCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Available</p>
              <p className="mt-0.5 font-semibold text-slate-900">{availableCount}</p>
            </div>
            {shelter.capacity > 0 && (
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Capacity</p>
                <p className="mt-0.5 font-medium text-slate-700">
                  {animalCount} / {shelter.capacity}
                  {occupancy !== null && <span className="text-slate-400"> ({occupancy}%)</span>}
                </p>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 p-5 pt-4">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400">
              <PawPrint className="h-4 w-4" aria-hidden />
              {shelter.name}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
              View Animals
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
            </span>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
};
