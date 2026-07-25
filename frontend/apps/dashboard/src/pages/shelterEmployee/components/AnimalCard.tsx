import { motion, useReducedMotion } from "framer-motion";
import { Edit, Eye, Images, PawPrint, RotateCcw, Trash2 } from "lucide-react";
import { Badge, Card, RowActionsMenu } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { Animal } from "@paw-match/types";

const adoptionStatusTone: Record<Animal["adoptionStatus"], BadgeTone> = {
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

const healthStatusLabel: Record<Animal["healthStatus"], string> = {
  healthy: "Healthy",
  needsCare: "Needs care",
  specialNeeds: "Special needs",
  underTreatment: "Under treatment",
};

export interface AnimalCardProps {
  animal: Animal;
  index?: number;
  onView: () => void;
  onEdit: () => void;
  onManageImages: () => void;
  onDelete: () => void;
  /** Only ever called for an already-inactive animal — see the isActive branch below. Optional since only Super Admin's "Inactive" tab can ever put an inactive animal in front of this card in the first place. */
  onRestore?: () => void;
}

/**
 * Dashboard-specific — distinct from the Public Website's adopter-facing
 * AnimalCard (that one links to a detail page and has no action menu; this
 * one is a management surface, not a navigable link). Visual language
 * (image-led card, status badge overlay) is deliberately the same.
 */
export const AnimalCard = ({ animal, index = 0, onView, onEdit, onManageImages, onDelete, onRestore }: AnimalCardProps) => {
  const reduceMotion = Boolean(useReducedMotion());
  const primaryImage = animal.images.find((image) => image.isPrimary) ?? animal.images[0];

  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.04 }}
    >
      <Card padding="none" className="h-full overflow-hidden">
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          {primaryImage ? (
            <img src={primaryImage.url} alt="" className="h-full w-full object-cover" />
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
          <span className="absolute start-2 top-2 rounded-full bg-white/90 shadow-md">
            <RowActionsMenu
              label={`More actions for ${animal.name}`}
              actions={[
                { label: "View", icon: Eye, onClick: onView },
                { label: "Edit", icon: Edit, onClick: onEdit },
                { label: "Manage images", icon: Images, onClick: onManageImages },
                animal.isActive
                  ? {
                      label: "Delete",
                      icon: Trash2,
                      tone: "danger",
                      disabled: animal.adoptionStatus === "adopted",
                      disabledReason: "Adopted animals cannot be deleted",
                      onClick: onDelete,
                    }
                  : {
                      label: "Restore",
                      icon: RotateCcw,
                      onClick: () => onRestore?.(),
                    },
              ]}
            />
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="text-lg font-semibold text-slate-900">{animal.name}</h3>
          <p className="text-sm text-slate-600">
            {animal.breed} · {animal.age} {animal.ageUnit}
          </p>
          <p className="text-xs text-slate-400">{animal.shelterId.name}</p>

          <div className="mt-1 flex flex-wrap gap-2">
            <Badge tone="neutral" className="capitalize">
              {animal.species}
            </Badge>
            <Badge tone="neutral" className="capitalize">
              {animal.gender}
            </Badge>
            <Badge tone="neutral">{healthStatusLabel[animal.healthStatus]}</Badge>
            {!animal.isActive && <Badge tone="danger">Inactive</Badge>}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
