import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { ButtonLink } from "@paw-match/ui";
import type { Animal } from "@paw-match/types";
import { paths } from "../../../routes/paths";

export interface QuickViewModalProps {
  animal: Animal | null;
  onClose: () => void;
}

export const QuickViewModal = ({ animal, onClose }: QuickViewModalProps) => {
  const primaryImage = animal?.images.find((image) => image.isPrimary) ?? animal?.images[0];

  return (
    <AnimatePresence>
      {animal && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${animal.name} quick view`}
            className="relative grid max-h-[85vh] w-full max-w-3xl grid-cols-1 overflow-hidden rounded-[32px] bg-white shadow-2xl sm:grid-cols-2"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close quick view"
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md hover:bg-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <div className="h-64 sm:h-full">
              {primaryImage ? (
                <img
                  src={primaryImage.url}
                  alt={animal.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-slate-100" />
              )}
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto p-6 sm:p-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{animal.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {animal.breed} &middot; {animal.age} {animal.ageUnit} old &middot;{" "}
                  {animal.gender}
                </p>
              </div>

              {animal.description && (
                <p className="text-sm leading-relaxed text-slate-600">{animal.description}</p>
              )}

              <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Size</dt>
                  <dd className="font-medium capitalize text-slate-700">{animal.size}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Health</dt>
                  <dd className="font-medium capitalize text-slate-700">
                    {animal.healthStatus.replace(/([A-Z])/g, " $1")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Vaccinated</dt>
                  <dd className="font-medium text-slate-700">{animal.vaccinated ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Shelter</dt>
                  <dd className="font-medium text-slate-700">{animal.shelterId.name}</dd>
                </div>
              </dl>

              <div className="mt-2 flex flex-wrap gap-3">
                <ButtonLink to={paths.animalDetail(animal._id)} size="lg">
                  View full profile
                </ButtonLink>
                <Link
                  to={paths.shelters}
                  className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  See shelter
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
